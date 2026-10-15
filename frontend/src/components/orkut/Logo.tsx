import { cn } from "@/lib/utils";

// O clássico "orkut" rosa minúsculo — Poppins ExtraBold approxima as letras arredondadas do logo original.
export function Logo({ size = "md", className }: { size?: "md" | "lg"; className?: string }) {
  return (
    <span
      data-testid="logo"
      className={cn(
        "font-logo select-none font-extrabold lowercase leading-none tracking-tight text-[#EC008C]",
        size === "lg" ? "text-5xl" : "text-[26px]",
        className,
      )}
    >
      orkut
    </span>
  );
}