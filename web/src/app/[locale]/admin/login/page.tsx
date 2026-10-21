import { AdminLogin } from "@/components/admin-login";
import { hasSupabase } from "@/lib/env";
export const metadata = {
  title: "Private dashboard",
  robots: { index: false, follow: false },
};
export default async function Login({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return <AdminLogin enabled={hasSupabase()} locale={(await params).locale} />;
}
