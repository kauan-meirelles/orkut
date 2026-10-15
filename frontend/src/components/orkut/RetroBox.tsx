import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// The classic white panel with a light header strip — the Orkut building block (neutral, 2004 style).
export function RetroBox({
  title,
  action,
  children,
  className,
  bodyClassName,
  testid,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  testid?: string;
}) {
  return (
    <section
      data-testid={testid}
      className={cn(
        "rounded-[4px] border border-[#D5DAE3] bg-white shadow-[0_1px_3px_rgba(40,50,70,0.10)]",
        className,
      )}
    >
      {title !== undefined && (
        <header className="flex min-h-9 items-center justify-between gap-2 rounded-t-[3px] border-b border-[#E4E7EF] bg-gradient-to-b from-[#F2F4F8] to-[#E7EAF1] px-3 py-1.5">
          <h2 className="text-[13px] font-bold tracking-tight text-[#333F54]">{title}</h2>
          {action}
        </header>
      )}
      <div className={cn("p-3", bodyClassName)}>{children}</div>
    </section>
  );
}