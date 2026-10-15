import { cn } from "@/lib/utils";
import { EMOTICONS } from "@/lib/orkut";

// Longest codes first so ":o" never beats "(6)"-style overlaps; one capture group keeps
// split() interleaving delimiters and matches.
const MAP = new Map(EMOTICONS.map((e) => [e.code.toLowerCase(), e.emoji]));
const PATTERN = new RegExp(
  `(${EMOTICONS.map((e) => e.code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .sort((a, b) => b.length - a.length)
    .join("|")})`,
  "gi",
);

// Renders text with classic Orkut shortcodes converted to emojis — no HTML injection ever.
export function EmoticonText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cn("whitespace-pre-wrap break-words", className)}>
      {text.split(PATTERN).map((part, i) => {
        if (!part) return null;
        const emoji = MAP.get(part.toLowerCase());
        return emoji ? (
          <span key={i} role="img" aria-label={emoji} title={part} className="inline-block">
            {emoji}
          </span>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </span>
  );
}

// The classic picker toolbar: appends the shortcode so the textarea keeps raw text.
export function EmoticonBar({ onPick }: { onPick: (code: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1" data-testid="emoticon-bar">
      {EMOTICONS.map((e) => (
        <button
          key={e.id}
          type="button"
          data-testid={`emoticon-${e.id}`}
          title={`${e.code} (${e.label})`}
          aria-label={`emoticon ${e.label}`}
          onClick={() => onPick(e.code)}
          className="rounded-[3px] border border-[#B0C4DE] bg-[#EBF2FC] px-1.5 py-0.5 text-sm leading-none transition-colors duration-150 hover:brightness-95 active:translate-y-px"
        >
          <span role="img" aria-hidden="true">
            {e.emoji}
          </span>
        </button>
      ))}
    </div>
  );
}