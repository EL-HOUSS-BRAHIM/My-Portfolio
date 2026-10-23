import { demoContent } from "../src/lib/demo-content";
import { contentSchema } from "../src/lib/models";
// Reviewable publication payload. This script never connects to a database.
const rows = demoContent.map((item) => contentSchema.parse(item));
if (process.argv.includes("--sql")) {
  const payload = JSON.stringify(rows).replaceAll("'", "''");
  console.log(`begin;
-- Existing dashboard entries stay authoritative. Only missing records are inserted.
do $publish$
declare item jsonb; item_id uuid;
begin
  for item in select value from jsonb_array_elements('${payload}'::jsonb) loop
    item_id := null;
    insert into public.content (id,kind,slug,category,tags,image,source_url,demo_url,featured,sort_order)
    values ((item->>'id')::uuid,item->>'kind',item->>'slug',item->>'category',array(select jsonb_array_elements_text(item->'tags')),item->>'image',item->>'source_url',item->>'demo_url',(item->>'featured')::boolean,(item->>'sort_order')::integer)
    on conflict do nothing returning id into item_id;
    if item_id is not null then
      insert into public.content_translations(content_id,locale,title,summary,body,published)
      select item_id,key,value->>'title',value->>'summary',value->>'body',(value->>'published')::boolean
      from jsonb_each(item->'translations');
    end if;
  end loop;
end $publish$;
commit;`);
} else console.log(JSON.stringify(rows, null, 2));
