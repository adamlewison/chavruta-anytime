"use client";

import { useTransition } from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { disconnectAccount } from "@/server/actions/profile";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mail, CheckCircle2, Link2Off } from "lucide-react";

interface LinkedAccount {
  provider: string;
  providerAccountId: string;
}

interface ConnectedAccountsProps {
  linkedAccounts: LinkedAccount[];
  userEmail: string;
}

const PROVIDERS = [
  {
    id: "google",
    label: "Google",
    description: "Sign in with your Google account",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.94.46 3.77 1.18 5.42l3.66-2.84Z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
          fill="#EA4335"
        />
      </svg>
    ),
    available: true,
  },
  {
    id: "apple",
    label: "Apple",
    description: "Sign in with your Apple ID",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-foreground" aria-hidden="true">
        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
      </svg>
    ),
    available: false,
  },
  {
    id: "facebook",
    label: "Facebook",
    description: "Sign in with your Facebook account",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
          fill="#1877F2"
        />
      </svg>
    ),
    available: false,
  },
  {
    id: "torahanytime",
    label: "TorahAnytime",
    description: "Connect your TorahAnytime account",
    icon: (
      <img src="/torahanytime-logo.png" alt="TorahAnytime" className="h-5 w-5 object-contain" />
    ),
    available: false,
  },
] as const;

function ProviderRow({
  provider,
  isLinked,
  userEmail,
}: {
  provider: (typeof PROVIDERS)[number];
  isLinked: boolean;
  userEmail: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleConnect() {
    signIn(provider.id, { callbackUrl: "/settings/accounts" });
  }

  function handleDisconnect() {
    startTransition(async () => {
      const result = await disconnectAccount(provider.id);
      if (result.success) {
        toast.success(`${provider.label} disconnected`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to disconnect");
      }
    });
  }

  return (
    <div className="flex items-center gap-4 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-background">
        {provider.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{provider.label}</p>
          {!provider.available && (
            <Badge variant="secondary" className="text-xs">
              Coming soon
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {isLinked ? userEmail : provider.description}
        </p>
      </div>

      <div className="shrink-0">
        {!provider.available ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : isLinked ? (
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-muted-foreground hover:text-destructive"
              onClick={handleDisconnect}
              disabled={isPending}
            >
              <Link2Off className="h-3.5 w-3.5" />
              Disconnect
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleConnect}
            disabled={isPending}
          >
            Connect
          </Button>
        )}
      </div>
    </div>
  );
}

export function ConnectedAccounts({
  linkedAccounts,
  userEmail,
}: ConnectedAccountsProps) {
  const linkedProviders = new Set(linkedAccounts.map((a) => a.provider));

  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-foreground">
          Connected accounts
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage the accounts and sign-in methods linked to your profile.
        </p>
      </div>

      <div className="rounded-lg border border-border divide-y divide-border">
        {/* Email / passwordless — always active */}
        <div className="flex items-center gap-4 px-4 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-background">
            <Mail className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Email</p>
            <p className="text-xs text-muted-foreground">{userEmail}</p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-xs text-muted-foreground">Passwordless</span>
          </div>
        </div>

        {/* OAuth providers */}
        {PROVIDERS.map((provider) => (
          <div key={provider.id} className="px-4">
            <ProviderRow
              provider={provider}
              isLinked={linkedProviders.has(provider.id)}
              userEmail={userEmail}
            />
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        You can always sign in via email code regardless of which accounts are
        connected.
      </p>
    </section>
  );
}
