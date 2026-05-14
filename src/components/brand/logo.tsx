import Image from "next/image";
import logoSrc from "../../../public/ca-logo.png";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: 28,
  md: 36,
  lg: 56,
} as const;

export function Logo({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const height = sizeMap[size];
  const width = Math.round((logoSrc.width / logoSrc.height) * height);
  return (
    <Image
      src={logoSrc}
      alt="ChavrutaAnytime"
      height={height}
      width={width}
      className={cn("object-contain", className)}
      priority
    />
  );
}
