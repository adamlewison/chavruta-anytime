import Image from "next/image";
import Link from "next/link";
import logoNameSrc from "../../../public/ca-logo-name.png";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background px-6 py-14 sm:px-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
        <Image
          src={logoNameSrc}
          alt="ChavrutaAnytime"
          height={36}
          width={Math.round((logoNameSrc.width / logoNameSrc.height) * 36)}
          className="h-9 w-auto opacity-80"
        />

        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/sign-in" className="transition-colors hover:text-foreground">
            Sign In
          </Link>
          <Link href="/chaburas" className="transition-colors hover:text-foreground">
            Chaburas
          </Link>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <p className="text-sm text-muted-foreground">
            Built with love for the beis medrash.
          </p>
          <p className="text-xs text-muted-foreground/60">
            &copy; {new Date().getFullYear()} ChavrutaAnytime. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
