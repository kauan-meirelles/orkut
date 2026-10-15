// Shared Orkut helpers: classic emoticons, pt-BR date formatting, preset images, error messages.
import { ApiError } from "@/lib/api";

export interface Emoticon {
  id: string;
  code: string;
  emoji: string;
  label: string;
}

export const EMOTICONS: Emoticon[] = [
  { id: "sorriso", code: ":)", emoji: "😊", label: "sorriso" },
  { id: "risonho", code: ":D", emoji: "😄", label: "risonho" },
  { id: "piscadinha", code: ";)", emoji: "😉", label: "piscadinha" },
  { id: "lingua", code: ":P", emoji: "😛", label: "língua" },
  { id: "triste", code: ":(", emoji: "😢", label: "triste" },
  { id: "surpreso", code: ":o", emoji: "😮", label: "surpreso" },
  { id: "oculos", code: "(H)", emoji: "😎", label: "óculos escuros" },
  { id: "anjo", code: "(A)", emoji: "😇", label: "anjo" },
  { id: "diabinho", code: "(6)", emoji: "😈", label: "diabinho" },
  { id: "coracao", code: "(L)", emoji: "❤️", label: "coração" },
  { id: "beijo", code: "(K)", emoji: "😘", label: "beijo" },
  { id: "flor", code: "(F)", emoji: "🌹", label: "flor" },
  { id: "camera", code: "(P)", emoji: "📷", label: "câmera" },
];

export const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces",
];

export const COMMUNITY_CATEGORIES = [
  "Nostalgia",
  "Humor",
  "Música",
  "Esportes",
  "Tecnologia",
  "Arte",
  "Cultura",
  "Outros",
];

export const DEMO_ACCOUNTS = [
  {
    name: "Bruno G.",
    email: "bruno@orkut.com",
    avatar_url: AVATAR_PRESETS[0],
  },
  {
    name: "Carol Mendes",
    email: "carol@orkut.com",
    avatar_url: AVATAR_PRESETS[1],
  },
  {
    name: "Rodrigo Silva",
    email: "rodrigo@orkut.com",
    avatar_url: AVATAR_PRESETS[2],
  },
  {
    name: "Juliana P.",
    email: "juliana@orkut.com",
    avatar_url: AVATAR_PRESETS[3],
  },
];

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function errMessage(e: unknown): string {
  if (e instanceof ApiError) {
    const detail = (e.body as { detail?: unknown } | null)?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((d) =>
          typeof d === "object" && d !== null && "msg" in d
            ? String((d as { msg: unknown }).msg)
            : String(d),
        )
        .join("; ");
    }
    return `Erro ${e.status}`;
  }
  return "Algo deu errado. Tente de novo.";
}
