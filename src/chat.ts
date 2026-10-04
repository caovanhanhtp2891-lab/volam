import { MAX_EXPERIENCE_BUFF, validExperienceBuff } from "./level-limits.ts";
export const MAX_CHAT_LENGTH = 160;
export const MAX_CHAT_HISTORY = 80;
export interface ChatMessage {
  id: string;
  name: string;
  text: string;
  kind: "player" | "bot" | "system";
  at: number;
}
export type ChatInput =
  | { kind: "message"; text: string }
  | { kind: "experience"; multiplier: number }
  | { kind: "error"; text: string };
export function parseChatInput(raw: string): ChatInput {
  const text = raw.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  if (!text) return { kind: "error", text: "Nhập tin nhắn hoặc /kn 1–1000." };
  if (text.length > MAX_CHAT_LENGTH)
    return { kind: "error", text: `Tin nhắn tối đa ${MAX_CHAT_LENGTH} ký tự.` };
  if (text.startsWith("/")) {
    const match = /^\/kn\s+(\d+)$/i.exec(text);
    if (match && validExperienceBuff(Number(match[1])))
      return { kind: "experience", multiplier: Number(match[1]) };
    return {
      kind: "error",
      text: `Dùng /kn x, với x là số nguyên 1–${MAX_EXPERIENCE_BUFF}. /kn 1 trở về XP bình thường.`,
    };
  }
  return { kind: "message", text };
}
export function appendChat(
  history: ChatMessage[],
  message: ChatMessage,
): boolean {
  if (
    !validChatMessage(message) ||
    history.some((existing) => existing.id === message.id)
  )
    return false;
  history.push({ ...message });
  if (history.length > MAX_CHAT_HISTORY)
    history.splice(0, history.length - MAX_CHAT_HISTORY);
  return true;
}
export function validChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const m = value as ChatMessage;
  return (
    typeof m.id === "string" &&
    m.id.length > 0 &&
    m.id.length <= 100 &&
    typeof m.name === "string" &&
    m.name.trim().length > 0 &&
    m.name.length <= 40 &&
    typeof m.text === "string" &&
    m.text.trim().length > 0 &&
    m.text.length <= MAX_CHAT_LENGTH &&
    !/[\u0000-\u001f\u007f]/.test(m.text) &&
    ["player", "bot", "system"].includes(m.kind) &&
    Number.isSafeInteger(m.at) &&
    m.at >= 0
  );
}
