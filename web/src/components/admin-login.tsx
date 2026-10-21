"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { browserClient } from "@/lib/supabase/browser";
export function AdminLogin({
  enabled,
  locale,
}: {
  enabled: boolean;
  locale: string;
}) {
  const router = useRouter();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [factor, setFactor] = useState(""),
    [qr, setQr] = useState("");
  if (!enabled)
    return (
      <div className="auth-box">
        <h1>Private dashboard</h1>
        <p>
          Administrator access becomes available once Supabase is configured.
          Public registration is disabled.
        </p>
      </div>
    );
  return (
    <div className="auth-box">
      <h1>Private dashboard</h1>
      <p>Sign in with your invited account, then verify your authenticator.</p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          setBusy(true);
          const data = new FormData(e.currentTarget);
          const db = browserClient();
          try {
            if (!factor) {
              const { error: loginError } = await db.auth.signInWithPassword({
                email: String(data.get("email")),
                password: String(data.get("password")),
              });
              if (loginError)
                throw new Error("Unable to sign in. Check your credentials.");
              const { data: assurance } =
                await db.auth.mfa.getAuthenticatorAssuranceLevel();
              if (assurance?.currentLevel === "aal2") {
                router.push(`/${locale}/admin`);
                router.refresh();
                return;
              }
              const { data: factors, error: listError } =
                await db.auth.mfa.listFactors();
              if (listError) throw listError;
              const existing = factors.totp.find(
                (f) => f.status === "verified",
              );
              if (existing) {
                setFactor(existing.id);
              } else {
                for (const old of factors.all.filter(
                  (f) => f.factor_type === "totp" && f.status === "unverified",
                ))
                  await db.auth.mfa.unenroll({ factorId: old.id });
                const { data: enrolled, error: enrollError } =
                  await db.auth.mfa.enroll({
                    factorType: "totp",
                    friendlyName: "Portfolio admin",
                  });
                if (enrollError) throw enrollError;
                setFactor(enrolled.id);
                setQr(enrolled.totp.qr_code);
              }
            } else {
              const { error: verifyError } =
                await db.auth.mfa.challengeAndVerify({
                  factorId: factor,
                  code: String(data.get("code")),
                });
              if (verifyError)
                throw new Error("Invalid verification code. Try again.");
              router.push(`/${locale}/admin`);
              router.refresh();
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : "Sign-in failed");
          } finally {
            setBusy(false);
          }
        }}
      >
        {!factor ? (
          <>
            <label>
              <span className="field-label">Email</span>
              <input
                type="email"
                name="email"
                autoComplete="username"
                required
              />
            </label>
            <label>
              <span className="field-label">Password</span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                minLength={8}
              />
            </label>
          </>
        ) : (
          <>
            {qr && (
              <>
                <p>
                  Scan this code in your authenticator, then enter its six-digit
                  code.
                </p>
                <Image
                  className="qr-code"
                  src={qr}
                  alt="Authenticator enrollment QR code"
                  width={220}
                  height={220}
                  unoptimized
                />
              </>
            )}
            <label>
              <span className="field-label">Authenticator code</span>
              <input
                name="code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                autoComplete="one-time-code"
                required
              />
            </label>
          </>
        )}
        <button className="button" disabled={busy}>
          {busy ? "Checking…" : factor ? "Verify and continue" : "Sign in"}
        </button>
        <p role="alert">{error}</p>
      </form>
    </div>
  );
}
