import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BeisLetter } from "./beis-letter";

export function EmptyState({
  heading,
  description,
  action,
  letter,
  className,
}: {
  heading: string;
  description: string;
  action?: { label: string; href: string };
  letter?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-muted px-6 py-12 text-center",
        className,
      )}
    >
      <BeisLetter letter={letter} />

      <div className="relative z-10 mx-auto max-w-sm space-y-3">
        <h3 className="text-lg font-semibold text-foreground">
          {heading}
        </h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        {action && (
          <Button asChild className="bg-accent text-white hover:bg-accent/90">
            <Link href={action.href}>{action.label}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
