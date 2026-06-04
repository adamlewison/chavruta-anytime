import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "Account ID — Settings — ChavrutaAnytime",
};

export default async function AccountIdPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Account ID
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Your unique identifier on ChavrutaAnytime.
        </p>
      </div>

      <section className="space-y-5">
        <div className="grid gap-2 sm:grid-cols-[10rem_1fr] sm:items-start">
          <Label className="pt-2">User ID</Label>
          <div className="flex flex-col gap-1">
            <p className="font-mono text-sm text-foreground break-all">
              {session.user.id}
            </p>
            <p className="text-xs text-muted-foreground">
              This ID is permanent and cannot be changed.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
