"use client";

import { Suspense, useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { sendPasscode } from "@/server/actions/auth";
import { Logo } from "@/components/brand/logo";
import Link from "next/link";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [resendTimer, setResendTimer] = useState(RESEND_SECONDS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((t) => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const focusInput = useCallback((index: number) => {
    inputs.current[index]?.focus();
  }, []);

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < CODE_LENGTH - 1) {
      focusInput(index + 1);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      focusInput(index - 1);
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);
    focusInput(Math.min(pasted.length, CODE_LENGTH - 1));
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length < CODE_LENGTH) return;
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      code,
      redirect: false,
    });

    if (result?.ok) {
      router.push("/dashboard");
    } else {
      setError("Invalid or expired code");
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendTimer > 0) return;
    const result = await sendPasscode(email);
    if (result.success) {
      setResendTimer(RESEND_SECONDS);
    }
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <Logo size="lg" />

      <div className="w-full rounded-xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-center text-2xl font-semibold text-foreground">
          Check your email
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          We sent a 6-digit code to{" "}
          {email ? <strong>{email}</strong> : "your inbox"}
        </p>

        <form onSubmit={handleVerify} className="mt-8">
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                disabled={loading}
                className="h-14 w-12 rounded-lg border border-input bg-background text-center text-xl font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
            ))}
          </div>

          {error && (
            <p className="mt-3 text-center text-sm text-destructive">{error}</p>
          )}
          <button
            type="submit"
            disabled={digits.join("").length < CODE_LENGTH || loading}
            className="mt-6 w-full rounded-lg bg-accent px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Verifying…" : "Verify"}
          </button>
        </form>

        <div className="mt-4 text-center">
          {resendTimer > 0 ? (
            <p className="text-sm text-muted-foreground">
              Resend code in {resendTimer}s
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="text-sm font-medium text-accent transition-colors hover:text-accent/80"
            >
              Resend code
            </button>
          )}
        </div>
      </div>

      <Link
        href="/sign-in"
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        &larr; Back to sign in
      </Link>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center gap-8">
          <Logo size="lg" />
          <div className="w-full rounded-xl border border-border bg-card p-8 shadow-sm">
            <p className="text-center text-sm text-muted-foreground">
              Loading…
            </p>
          </div>
        </div>
      }
    >
      <VerifyForm />
    </Suspense>
  );
}
