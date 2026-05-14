import { Logo } from "@/components/brand/logo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background px-6 py-10 sm:px-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center">
        <Logo size="sm" />
        <p className="text-sm text-muted-foreground">
          Built with ❤️ for the beis medrash
        </p>
        <p className="text-xs text-muted-foreground/60">
          &copy; {new Date().getFullYear()} ChavrutaAnytime. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
