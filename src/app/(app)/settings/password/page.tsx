import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Password — Settings — ChavrutaAnytime",
};

export default function PasswordPage() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Password</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Passwordless sign-in enabled</p>
            <p className="text-sm text-muted-foreground">
              ChavrutaAnytime uses secure, passwordless authentication — no
              password to remember or lose. Each time you sign in, a one-time
              code is sent to your email address.
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          To sign in from a new device, go to the sign-in page and enter your
          email to receive a code.
        </p>
      </CardContent>
    </Card>
  );
}
