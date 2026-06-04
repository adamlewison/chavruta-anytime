"use client";

import { useRef, useState, useCallback, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { sendEmailChangeCode, confirmEmailChange } from "@/server/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;

interface EmailSettingsProps {
  currentEmail: string;
}

export function EmailSettings({ currentEmail }: EmailSettingsProps) {
  const router = useRouter();
  const { update } = useSession();

  const [step, setStep] = useState<"enter" | "verify">("enter");
  const [newEmail, setNewEmail] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [resendTimer, setResendTimer] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const focusInput = useCallback((index: number) => {
    inputs.current[index]?.focus();
  }, []);

  function handleDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < CODE_LENGTH - 1) focusInput(index + 1);
  }

  function handleDigitKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      focusInput(index - 1);
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    focusInput(Math.min(pasted.length, CODE_LENGTH - 1));
  }

  function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await sendEmailChangeCode(newEmail);
      if (result.success) {
        setPendingEmail(newEmail.trim().toLowerCase());
        setDigits(Array(CODE_LENGTH).fill(""));
        setResendTimer(RESEND_SECONDS);
        setStep("verify");
        setTimeout(() => focusInput(0), 50);
      } else {
        setError(result.error ?? "Failed to send code");
      }
    });
  }

  function handleResend() {
    if (resendTimer > 0) return;
    setError(null);
    startTransition(async () => {
      const result = await sendEmailChangeCode(pendingEmail);
      if (result.success) {
        setResendTimer(RESEND_SECONDS);
        setDigits(Array(CODE_LENGTH).fill(""));
        setTimeout(() => focusInput(0), 50);
      } else {
        setError(result.error ?? "Failed to resend code");
      }
    });
  }

  function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length < CODE_LENGTH) return;
    setError(null);
    startTransition(async () => {
      const result = await confirmEmailChange(pendingEmail, code);
      if (result.success) {
        toast.success("Email updated");
        await update();
        router.refresh();
        setStep("enter");
        setNewEmail("");
        setPendingEmail("");
        setDigits(Array(CODE_LENGTH).fill(""));
      } else {
        setError(result.error ?? "Invalid or expired code");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Email address</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label className="text-muted-foreground">Current email</Label>
          <p className="text-sm font-medium">{currentEmail}</p>
        </div>

        <Separator />

        {step === "enter" && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-email">New email address</Label>
              <Input
                id="new-email"
                type="email"
                required
                placeholder="new@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                disabled={isPending}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              type="submit"
              disabled={isPending || !newEmail}
              className="w-full"
            >
              {isPending ? "Sending…" : "Send verification code"}
            </Button>
          </form>
        )}

        {step === "verify" && (
          <form onSubmit={handleConfirm} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We sent a 6-digit code to{" "}
              <span className="font-medium text-foreground">{pendingEmail}</span>.
              Enter it below to confirm the change.
            </p>

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
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(i, e)}
                  disabled={isPending}
                  className="h-14 w-12 rounded-lg border border-input bg-background text-center text-xl font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                />
              ))}
            </div>

            {error && (
              <p className="text-center text-sm text-destructive">{error}</p>
            )}

            <Button
              type="submit"
              disabled={digits.join("").length < CODE_LENGTH || isPending}
              className="w-full"
            >
              {isPending ? "Verifying…" : "Confirm email change"}
            </Button>

            <div className="text-center">
              {resendTimer > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Resend code in {resendTimer}s
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isPending}
                  className="text-sm font-medium text-foreground underline-offset-4 hover:underline disabled:opacity-50"
                >
                  Resend code
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setStep("enter");
                setError(null);
              }}
              className="block w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              &larr; Use a different email
            </button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
