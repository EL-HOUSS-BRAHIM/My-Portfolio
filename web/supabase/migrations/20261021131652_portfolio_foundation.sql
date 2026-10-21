-- Application schema. All API-facing tables use RLS. No default users or endorsements.
create table public.admin_members (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.admin_members enable row level security;
grant select on public.admin_members to anon, authenticated;
create policy own_membership on public.admin_members for select to authenticated using (user_id=(select auth.uid()));
create function public.is_admin() returns boolean language sql stable security invoker set search_path='' as $$
 select coalesce(auth.jwt()->>'aal','')='aal2' and exists(select 1 from public.admin_members where user_id=(select auth.uid()));
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon,authenticated,service_role;

create table public.content (
 id uuid primary key default gen_random_uuid(),
 kind text not null check(kind in ('project','post','skill','experience','education','service','settings','testimonial')),
 slug text not null check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 category text not null default '', tags text[] not null default '{}', image text not null default '',
 source_url text not null default '',demo_url text not null default '',
 featured boolean not null default false,sort_order integer not null default 0,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(kind,slug)
);
create table public.content_translations (
 content_id uuid not null references public.content(id) on delete cascade,
 locale text not null check(locale in ('en','fr','ar')),
 title text not null check(length(title)<=180),summary text not null default '',body text not null default '',
 published boolean not null default false check(not published or length(title)>=2),
 primary key(content_id,locale)
);
create index content_listing on public.content(kind,sort_order);
create index translation_published on public.content_translations(content_id,locale) where published;
alter table public.content enable row level security;
alter table public.content_translations enable row level security;
grant select on public.content,public.content_translations to anon,authenticated;
grant insert,update,delete on public.content,public.content_translations to authenticated;
create policy published_content on public.content for select to anon,authenticated using (
 exists(select 1 from public.content_translations t where t.content_id=id and t.published) or (select public.is_admin())
);
create policy visible_translations on public.content_translations for select to anon,authenticated using (published or (select public.is_admin()));
create policy admin_content on public.content for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy admin_translations on public.content_translations for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));

create table public.audit_events (
 id bigint generated always as identity primary key,actor_id uuid,
 action text not null,record_id uuid,kind text,created_at timestamptz not null default now()
);
alter table public.audit_events enable row level security;
grant select,insert on public.audit_events to authenticated;
grant usage on sequence public.audit_events_id_seq to authenticated;
create policy audit_read on public.audit_events for select to authenticated using((select public.is_admin()));
create policy audit_append on public.audit_events for insert to authenticated with check((select public.is_admin()) and actor_id=(select auth.uid()));
create function public.record_content_audit() returns trigger language plpgsql security invoker set search_path='' as $$
 begin
 insert into public.audit_events(actor_id,action,record_id,kind) values(auth.uid(),TG_OP,coalesce(NEW.id,OLD.id),coalesce(NEW.kind,OLD.kind));
 return coalesce(NEW,OLD);
 end;
$$;
create trigger content_audit after insert or update or delete on public.content for each row execute function public.record_content_audit();

-- Atomic content + translation editing; callers retain their RLS permissions.
create function public.save_content(payload jsonb) returns uuid language plpgsql security invoker set search_path='' as $$
 declare item_id uuid:=coalesce((payload->>'id')::uuid,gen_random_uuid()); lang text; tr jsonb;
 begin
 if not public.is_admin() and current_user<>'service_role' then raise insufficient_privilege; end if;
 if not coalesce((payload->'translations'->'en'->>'published')::boolean,false) and (
 coalesce((payload->'translations'->'fr'->>'published')::boolean,false) or coalesce((payload->'translations'->'ar'->>'published')::boolean,false)) then
 raise exception 'English must be published first'; end if;
 insert into public.content(id,kind,slug,category,tags,image,source_url,demo_url,featured,sort_order)
 values(item_id,payload->>'kind',payload->>'slug',payload->>'category',array(select jsonb_array_elements_text(payload->'tags')),payload->>'image',payload->>'source_url',payload->>'demo_url',(payload->>'featured')::boolean,(payload->>'sort_order')::integer)
 on conflict(id) do update set kind=excluded.kind,slug=excluded.slug,category=excluded.category,tags=excluded.tags,image=excluded.image,source_url=excluded.source_url,demo_url=excluded.demo_url,featured=excluded.featured,sort_order=excluded.sort_order,updated_at=now();
 foreach lang in array array['en','fr','ar'] loop
 tr:=payload->'translations'->lang;
 insert into public.content_translations(content_id,locale,title,summary,body,published)
 values(item_id,lang,tr->>'title',tr->>'summary',tr->>'body',(tr->>'published')::boolean)
 on conflict(content_id,locale) do update set title=excluded.title,summary=excluded.summary,body=excluded.body,published=excluded.published;
 end loop;
 return item_id;
 end;
$$;
revoke all on function public.save_content(jsonb) from public;
grant execute on function public.save_content(jsonb) to authenticated,service_role;

create table public.contact_messages (
 id uuid primary key default gen_random_uuid(), submission_id uuid not null unique,
 name text not null,email text not null,subject text not null default '',message text not null,
 locale text not null check(locale in ('en','fr','ar')),consent_at timestamptz default now(),
 origin text not null default 'website' check(origin in ('website','legacy')),
 status text not null default 'unread' check(status in ('unread','read','replied','archived')),
 created_at timestamptz not null default now()
);
create table public.testimonial_submissions (
 id uuid primary key default gen_random_uuid(),submission_id uuid not null unique,
 name text not null,message text not null,locale text not null check(locale in ('en','fr','ar')),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 consent_at timestamptz not null default now(),created_at timestamptz not null default now()
);
create table public.email_outbox (
 id uuid primary key default gen_random_uuid(),message_id uuid not null unique references public.contact_messages(id) on delete cascade,
 state text not null default 'pending' check(state in ('pending','processing','sent','failed')),
 attempts integer not null default 0,next_attempt_at timestamptz not null default now(),
 locked_at timestamptz,last_error text,sent_at timestamptz,created_at timestamptz not null default now()
);
create index outbox_due on public.email_outbox(next_attempt_at) where state in ('pending','processing');
create index enquiries_status on public.contact_messages(status,created_at desc);
create table public.rate_limits (
 key text primary key,attempts integer not null,window_start timestamptz not null,updated_at timestamptz not null default now()
);
create index rate_limit_expiry on public.rate_limits(updated_at);
create index enquiry_archive_expiry on public.contact_messages(created_at) where status='archived';
create table public.media_assets (
 id uuid primary key default gen_random_uuid(),path text not null unique,bucket text not null check(bucket in ('portfolio','drafts')),
 mime_type text not null,alt jsonb not null default '{}',created_at timestamptz not null default now()
);
create table public.legacy_imports (
 source text not null,legacy_id text not null,target_id uuid not null,checksum text not null,created_at timestamptz not null default now(),primary key(source,legacy_id)
);

do $$declare t text;begin
 foreach t in array array['contact_messages','testimonial_submissions','email_outbox','rate_limits','media_assets','legacy_imports'] loop
 execute format('alter table public.%I enable row level security',t);
 end loop;
 foreach t in array array['contact_messages','testimonial_submissions','email_outbox','media_assets'] loop
 execute format('grant select on public.%I to authenticated',t);
 execute format('create policy admin_read on public.%I for select to authenticated using ((select public.is_admin()))',t);
 end loop;
end $$;
grant update(status) on public.contact_messages,public.testimonial_submissions to authenticated;
create policy manage_enquiries on public.contact_messages for update to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy moderate_testimonials on public.testimonial_submissions for update to authenticated using((select public.is_admin())) with check((select public.is_admin()));
grant insert,delete on public.media_assets to authenticated;
create policy manage_media on public.media_assets for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
-- service_role is used only by the server/worker/importer, never a browser.
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

create function public.take_rate_limit(rate_key text,max_attempts integer,window_seconds integer) returns boolean language plpgsql security invoker set search_path='' as $$
 declare count_now integer;
 begin
 insert into public.rate_limits(key,attempts,window_start) values(rate_key,1,now())
 on conflict(key) do update set attempts=case when public.rate_limits.window_start<now()-make_interval(secs=>window_seconds) then 1 else public.rate_limits.attempts+1 end,
 window_start=case when public.rate_limits.window_start<now()-make_interval(secs=>window_seconds) then now() else public.rate_limits.window_start end,updated_at=now()
 returning attempts into count_now;
 return count_now<=max_attempts;
 end;
$$;
revoke all on function public.take_rate_limit(text,integer,integer) from public;
grant execute on function public.take_rate_limit(text,integer,integer) to service_role;

create function public.submit_contact(payload jsonb,rate_key text) returns uuid language plpgsql security invoker set search_path='' as $$
 declare message_id uuid;
 begin
 if not public.take_rate_limit(rate_key,5,3600) then raise exception 'rate_limited';end if;
 select id into message_id from public.contact_messages where submission_id=(payload->>'submissionId')::uuid;
 if message_id is not null then return message_id;end if;
 insert into public.contact_messages(submission_id,name,email,subject,message,locale)
 values((payload->>'submissionId')::uuid,payload->>'name',payload->>'email',payload->>'subject',payload->>'message',payload->>'locale')
 on conflict(submission_id) do nothing returning id into message_id;
 if message_id is null then select id into message_id from public.contact_messages where submission_id=(payload->>'submissionId')::uuid;end if;
 insert into public.email_outbox(message_id) values(message_id) on conflict do nothing;
 return message_id;
 end;
$$;
revoke all on function public.submit_contact(jsonb,text) from public;
grant execute on function public.submit_contact(jsonb,text) to service_role;

create function public.claim_email_jobs(batch_size integer default 5) returns setof public.email_outbox language sql security invoker set search_path='' as $$
 update public.email_outbox set state='processing',locked_at=now(),attempts=attempts+1
 where id in (select id from public.email_outbox where attempts<6 and ((state='pending' and next_attempt_at<=now()) or (state='processing' and locked_at<now()-interval '5 minutes')) order by next_attempt_at for update skip locked limit batch_size)
 returning *;
$$;
revoke all on function public.claim_email_jobs(integer) from public;
grant execute on function public.claim_email_jobs(integer) to service_role;

-- Daily worker maintenance. Never deletes active client enquiries marked replied/read.
create function public.cleanup_portfolio() returns void language plpgsql security invoker set search_path='' as $$
 begin
 delete from public.rate_limits where updated_at<now()-interval '30 days';
 delete from public.contact_messages where created_at<now()-interval '12 months' and status='archived';
 update public.email_outbox set state='failed',last_error='retry_limit' where state='processing' and attempts>=6 and locked_at<now()-interval '5 minutes';
 end;
$$;
revoke all on function public.cleanup_portfolio() from public;
grant execute on function public.cleanup_portfolio() to service_role;

-- Local fixture test harness supplies storage tables; Supabase provides these in production.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('portfolio','portfolio',true,5242880,array['image/jpeg','image/png','image/webp','application/pdf']),
 ('drafts','drafts',false,5242880,array['image/jpeg','image/png','image/webp','application/pdf']) on conflict(id) do nothing;
create policy portfolio_public_read on storage.objects for select to anon,authenticated using(bucket_id='portfolio');
create policy admin_storage_read on storage.objects for select to authenticated using(bucket_id in ('portfolio','drafts') and (select public.is_admin()));
create policy admin_storage_insert on storage.objects for insert to authenticated with check(bucket_id in ('portfolio','drafts') and (select public.is_admin()));
create policy admin_storage_update on storage.objects for update to authenticated using(bucket_id in ('portfolio','drafts') and (select public.is_admin())) with check(bucket_id in ('portfolio','drafts') and (select public.is_admin()));
create policy admin_storage_delete on storage.objects for delete to authenticated using(bucket_id in ('portfolio','drafts') and (select public.is_admin()));
