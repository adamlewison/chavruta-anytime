import Image from "next/image";
import logoNameSrc from "../../../public/ca-logo-name.png";
import { cn } from "@/lib/utils";

export function LogoName({ className }: { className?: string }) {
  return (
    <Image
      src={logoNameSrc}
      alt="ChavrutaAnytime"
      width={320}
      height={80}
      priority
      unoptimized
      className={cn("-mt-4", className)}
    />
  );
}
