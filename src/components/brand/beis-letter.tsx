import { cn } from "@/lib/utils";

export function BeisLetter({
  letter = "ב",
  className,
}: {
  letter?: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 flex items-center justify-center text-[12rem] leading-none opacity-[0.04] select-none",
        className,
      )}
    >
      {letter}
    </span>
  );
}
