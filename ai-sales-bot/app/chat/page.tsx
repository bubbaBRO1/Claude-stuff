import { db } from "@/lib/db";
import ChatInterface from "@/components/chat/ChatInterface";
import type { ChatMsg } from "@/types";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const raw = await db.chatMessage.findMany({
    orderBy: { createdAt: "asc" },
    take: 80,
  });

  const messages: ChatMsg[] = raw.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  }));

  return <ChatInterface initialMessages={messages} />;
}
