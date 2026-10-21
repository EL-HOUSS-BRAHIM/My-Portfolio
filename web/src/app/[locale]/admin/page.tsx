import { requireAdmin } from "@/lib/auth";
import { mapContent } from "@/lib/database-map";
import { AdminDashboard } from "@/components/admin-dashboard";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Private dashboard",
  robots: { index: false, follow: false },
};
export default async function Admin({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { db } = await requireAdmin(locale);
  const [content, messages, testimonials, outbox, media, audit] =
    await Promise.all([
      db
        .from("content")
        .select("*,content_translations(*)")
        .order("updated_at", { ascending: false }),
      db
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      db
        .from("testimonial_submissions")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(50),
      db
        .from("email_outbox")
        .select("id,state,attempts,created_at")
        .in("state", ["failed", "pending", "processing"])
        .limit(100),
      db
        .from("media_assets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
      db
        .from("audit_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30),
    ]);
  if (
    [content, messages, testimonials, outbox, media, audit].some((q) => q.error)
  )
    throw new Error("Dashboard data unavailable");
  return (
    <AdminDashboard
      initialContent={(content.data || []).map(mapContent)}
      messages={messages.data || []}
      testimonials={testimonials.data || []}
      outbox={outbox.data || []}
      media={media.data || []}
      audit={audit.data || []}
    />
  );
}
