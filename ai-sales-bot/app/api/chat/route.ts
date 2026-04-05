import { NextRequest } from "next/server";
import { anthropic, buildSalesmanSystemPrompt } from "@/lib/anthropic";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { message, industry = "business services", history = [] } = body;

  if (!message?.trim()) {
    return new Response(JSON.stringify({ error: "message required" }), { status: 400 });
  }

  // persist user message
  await db.chatMessage.create({ data: { role: "user", content: message } });

  const stream = anthropic.messages.stream({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    system: buildSalesmanSystemPrompt(industry),
    messages: [
      ...history.slice(-10).map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: message },
    ],
  });

  let fullText = "";

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      stream.on("text", (text) => {
        fullText += text;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
      });
      stream.on("finalMessage", async () => {
        await db.chatMessage.create({ data: { role: "assistant", content: fullText } });
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      });
      stream.on("error", (err) => {
        controller.error(err);
      });
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export async function GET() {
  const messages = await db.chatMessage.findMany({
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  return Response.json(messages);
}
