import pg from "pg";
import { readFile, readdir } from "node:fs/promises";
import assert from "node:assert/strict";
import { demoContent } from "../src/lib/demo-content";
const url = process.env.TEST_DATABASE_URL;
if (!url)
  throw new Error(
    "TEST_DATABASE_URL is required; use a disposable PostgreSQL database",
  );
const db = new pg.Client({ connectionString: url });
await db.connect();
// This harness intentionally resets only a disposable database, never a linked Supabase project.
if (
  !["localhost", "127.0.0.1", "postgres"].includes(new URL(url).hostname) &&
  process.env.CI !== "true"
)
  throw new Error("Local disposable database required");
try {
  await db.query(`drop schema if exists public cascade;drop schema if exists auth cascade;drop schema if exists storage cascade;create schema public;create schema auth;create schema storage;
 do $$begin if not exists(select from pg_roles where rolname='anon') then create role anon nologin;end if;if not exists(select from pg_roles where rolname='authenticated') then create role authenticated nologin;end if;if not exists(select from pg_roles where rolname='service_role') then create role service_role nologin bypassrls;end if;end $$;
 grant usage on schema public,auth,storage to anon,authenticated,service_role;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;grant all on storage.objects to authenticated,service_role;grant select on storage.objects to anon;
 `);
  for (const f of (await readdir("supabase/migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await db.query(await readFile(`supabase/migrations/${f}`, "utf8"));
  const owner = "11111111-1111-4111-8111-111111111111",
    other = "22222222-2222-4222-8222-222222222222";
  await db.query("insert into auth.users values($1),($2)", [owner, other]);
  await db.query("insert into public.admin_members(user_id) values($1)", [
    owner,
  ]);
  async function as(role: string, sub = "", aal = "aal1") {
    await db.query("reset role");
    await db.query(`set role ${role}`);
    await db.query(
      "select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",
      [sub, JSON.stringify({ aal })],
    );
  }
  async function denied(sql: string, values: unknown[] = []) {
    let blocked = false;
    try {
      await db.query(sql, values);
    } catch (e) {
      blocked = true;
      assert.ok(e instanceof Error);
    }
    assert.ok(blocked, `Expected permission rejection: ${sql}`);
  }
  const item = structuredClone(demoContent[0]);
  item.translations.fr.published = false;
  item.translations.fr.body = "PRIVATE FRENCH DRAFT";
  await as("service_role");
  await db.query("select public.save_content($1)", [item]);
  await as("anon");
  const publicRows = await db.query("select * from public.content");
  assert.equal(publicRows.rowCount, 1);
  const translations = await db.query(
    "select * from public.content_translations",
  );
  assert.equal(translations.rowCount, 2);
  assert.ok(
    !JSON.stringify(translations.rows).includes("PRIVATE FRENCH DRAFT"),
  );
  await denied("select * from public.contact_messages");
  await denied("select * from public.email_outbox");
  await denied("select public.take_rate_limit($1,5,3600)", ["evil"]);
  await denied("insert into public.content(kind,slug) values($1,$2)", [
    "post",
    "forbidden",
  ]);
  await as("authenticated", other, "aal2");
  assert.equal(
    (await db.query("select * from public.admin_members")).rowCount,
    0,
  );
  await denied("select public.save_content($1)", [item]);
  await as("authenticated", owner, "aal1");
  await denied("select public.save_content($1)", [item]);
  await as("authenticated", owner, "aal2");
  await db.query("select public.save_content($1)", [item]);
  assert.equal(
    (await db.query("select * from public.content_translations")).rowCount,
    3,
  );
  assert.ok(
    (await db.query("select * from public.audit_events")).rowCount! >= 2,
  );
  await db.query(
    "insert into storage.objects(bucket_id,name) values('drafts','private.webp')",
  );
  await as("anon");
  assert.equal((await db.query("select * from storage.objects")).rowCount, 0);
  await as("service_role");
  const submission = {
    name: "Test Person",
    email: "test@example.com",
    subject: "Test",
    message: "This is a sufficiently long test message.",
    locale: "en",
    submissionId: "33333333-3333-4333-8333-333333333333",
  };
  const a = await db.query("select public.submit_contact($1,$2)", [
    submission,
    "test-contact",
  ]);
  const b = await db.query("select public.submit_contact($1,$2)", [
    submission,
    "test-contact",
  ]);
  assert.equal(a.rows[0].submit_contact, b.rows[0].submit_contact);
  assert.equal(
    (await db.query("select * from public.email_outbox")).rowCount,
    1,
  );
  const jobs = await db.query("select * from public.claim_email_jobs(5)");
  assert.equal(jobs.rowCount, 1);
  assert.equal(
    (await db.query("select * from public.claim_email_jobs(5)")).rowCount,
    0,
  );
  for (let i = 0; i < 5; i++)
    assert.equal(
      (await db.query("select public.take_rate_limit($1,5,3600)", ["atomic"]))
        .rows[0].take_rate_limit,
      true,
    );
  assert.equal(
    (await db.query("select public.take_rate_limit($1,5,3600)", ["atomic"]))
      .rows[0].take_rate_limit,
    false,
  );
  await db.query("select public.cleanup_portfolio()");
  // Competing workers must claim different jobs while both transactions stay open.
  for (const suffix of [
    "44444444-4444-4444-8444-444444444444",
    "55555555-5555-4555-8555-555555555555",
  ])
    await db.query("select public.submit_contact($1,$2)", [
      { ...submission, submissionId: suffix },
      suffix,
    ]);
  const peers = [
    new pg.Client({ connectionString: url }),
    new pg.Client({ connectionString: url }),
  ];
  try {
    await Promise.all(
      peers.map(async (p) => {
        await p.connect();
        await p.query("begin");
        await p.query("set local role service_role");
      }),
    );
    const claimed = await Promise.all(
      peers.map((p) => p.query("select * from public.claim_email_jobs(1)")),
    );
    assert.equal(claimed[0].rowCount, 1);
    assert.equal(claimed[1].rowCount, 1);
    assert.notEqual(claimed[0].rows[0].id, claimed[1].rows[0].id);
    await Promise.all(peers.map((p) => p.query("commit")));
  } finally {
    await Promise.all(peers.map((p) => p.end()));
  }
  // Concurrent quota updates remain atomic across independent connections.
  const quotaPeers = Array.from(
    { length: 8 },
    () => new pg.Client({ connectionString: url }),
  );
  try {
    const allowed = await Promise.all(
      quotaPeers.map(async (p) => {
        await p.connect();
        await p.query("set role service_role");
        return (
          await p.query("select public.take_rate_limit('concurrent',5,3600)")
        ).rows[0].take_rate_limit;
      }),
    );
    assert.equal(allowed.filter(Boolean).length, 5);
  } finally {
    await Promise.all(quotaPeers.map((p) => p.end()));
  }
  console.info(
    "Database checks passed: migrations, RLS, MFA, draft isolation, storage, durable submission, deduplication, concurrent job claiming, persistent concurrent rate limiting.",
  );
} finally {
  await db.end();
}
