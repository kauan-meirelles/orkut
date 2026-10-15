import type { Meters as MetersT } from "@/lib/types";

function row(label: string, score: number, icon: string, testid: string) {
  const level = Math.round((score / 100) * 5);
  return (
    <div className="flex items-center justify-between gap-2 text-[12px]" data-testid={testid}>
      <span className="text-[#4B6E9C]">
        {score}% {label}
      </span>
      <span className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            role="img"
            aria-label={label}
            className={i < level ? "" : "opacity-25 grayscale"}
          >
            {icon}
          </span>
        ))}
      </span>
    </div>
  );
}

// The classic Orkut meters: confiável (smileys), legal (ice cubes), sexy (hearts).
export function Meters({ meters }: { meters: MetersT }) {
  return (
    <div className="flex flex-col gap-1.5">
      {row("confiável", meters.confiavel, "😊", "meter-confiavel")}
      {row("legal", meters.legal, "🧊", "meter-legal")}
      {row("sexy", meters.sexy, "❤️", "meter-sexy")}
    </div>
  );
}