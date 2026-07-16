import { useCallback, useRef, useState } from "react";
import { getScriptedReply } from "@/components/content/chatReplies";

export interface DemoChatMessage {
  id: string;
  author: "user" | "bot";
  text: string;
  createdAt: string;
}

let idSeq = 0;
function nextId(): string {
  idSeq += 1;
  return `msg-${Date.now()}-${idSeq}`;
}

export interface UseDemoChatResult {
  messages: DemoChatMessage[];
  isTyping: boolean;
  send: (text: string) => void;
}

/** Shared demo chat state: appends the user's message, then a scripted bot
 * reply after a short "typing" delay. Used by /messages and the ChatWidget. */
export function useDemoChat(initialBotText: string): UseDemoChatResult {
  const [messages, setMessages] = useState<DemoChatMessage[]>([
    { id: nextId(), author: "bot", text: initialBotText, createdAt: new Date().toISOString() },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const send = useCallback((raw: string) => {
    const text = raw.trim();
    if (!text) return;

    setMessages((current) => [
      ...current,
      { id: nextId(), author: "user", text, createdAt: new Date().toISOString() },
    ]);
    setIsTyping(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: nextId(),
          author: "bot",
          text: getScriptedReply(text),
          createdAt: new Date().toISOString(),
        },
      ]);
      setIsTyping(false);
    }, 900);
  }, []);

  return { messages, isTyping, send };
}
