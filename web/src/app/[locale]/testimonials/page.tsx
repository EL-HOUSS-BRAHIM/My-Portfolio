import { TestimonialForm } from "@/components/testimonial-form";
import { PageIntro } from "@/components/page-intro";
import { hasSupabase } from "@/lib/env";
export const metadata = { robots: { index: false, follow: true } };
export default async function Testimonials({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <div className="container">
      <PageIntro
        label="FEEDBACK"
        title={
          locale === "ar"
            ? "كيف كانت تجربتك؟"
            : locale === "fr"
              ? "Comment s’est passée notre collaboration ?"
              : "How was working together?"
        }
        intro={
          locale === "ar"
            ? "تُراجع التعليقات قبل نشرها."
            : locale === "fr"
              ? "Les témoignages sont modérés avant publication."
              : "Feedback is reviewed before publication."
        }
      />
      <div className="prose">
        <TestimonialForm enabled={hasSupabase()} />
      </div>
    </div>
  );
}
