"use client";
import { useState, useRef, useEffect } from "react";
import type { ChatMsg, EnhanceResult, SalesmanTone } from "@/types";
import MessageBubble, { StreamingBubble } from "./MessageBubble";
import EnhancedPreview from "./EnhancedPreview";
import SendPanel from "./SendPanel";
import Button from "../ui/Button";
import { useToast } from "../ui/Toast";

export default function ChatInterface({ initialMessages }: { initialMessages: ChatMsg[] }) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMsg[]>(initialMessages);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");

  // enhance panel state
  const [rawMessage, setRawMessage] = useState("");
  const [industry, setIndustry] = useState("business services");
  const [tone, setTone] = useState<SalesmanTone>("consultative");
  const [enhancing, setEnhancing] = useState(false);
  const [enhancedResult, setEnhancedResult] = useState<EnhanceResult | null>(null);
  const [showSendPanel, setShowSendPanel] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText]);

  const sendChat = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    setRawMessage(text);

    const userMsg: ChatMsg = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);
    setStreamText("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, industry, history: messages }),
      });

      if (!res.ok || !res.body) throw new Error("Failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const payload = line.slice(6);
            if (payload === "[DONE]") break;
            try {
              const { text } = JSON.parse(payload);
              full += text;
              setStreamText(full);
            } catch {}
          }
        }
      }

      const assistantMsg: ChatMsg = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: full,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      toast("Chat failed — is ANTHROPIC_API_KEY set?", "error");
    } finally {
      setStreaming(false);
      setStreamText("");
    }
  };

  const enhance = async () => {
    const text = rawMessage.trim() || input.trim();
    if (!text) {
      toast("Type a message to enhance", "error");
      return;
    }
    setRawMessage(text);
    setEnhancing(true);
    setEnhancedResult(null);
    try {
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawMessage: text, industry, tone }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setEnhancedResult(data);
    } catch {
      toast("Enhancement failed", "error");
    } finally {
      setEnhancing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  };

  return (
    <div className="flex h-screen gap-0">
      {/* ── chat column ── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* header */}
        <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
          <span className="text-xs font-bold tracking-widest uppercase text-zinc-200">
            Max — Sales AI
          </span>
          <span className="ml-auto text-[10px] text-zinc-600 uppercase tracking-widest">
            {industry}
          </span>
        </div>

        {/* messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          {messages.length === 0 && !streaming && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
              <div className="text-4xl mb-4">⚡</div>
              <p className="text-zinc-400 text-sm">
                Hey, I&apos;m Max — your AI sales closer.
              </p>
              <p className="text-zinc-600 text-xs mt-2 max-w-sm">
                Tell me about your product or paste a rough message. I&apos;ll craft it into a
                killer pitch, then blast it to your leads via SMS and email.
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          {streaming && <StreamingBubble text={streamText} />}
          <div ref={bottomRef} />
        </div>

        {/* compose bar */}
        <div className="px-4 pb-4 pt-2 border-t border-zinc-800">
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setRawMessage(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Tell Max your message or ask for sales advice… (Enter to send)"
              rows={2}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#00ff88]/40 resize-none"
            />
            <div className="flex flex-col gap-2">
              <Button onClick={sendChat} loading={streaming} disabled={!input.trim()}>
                Send
              </Button>
              <Button variant="outline" onClick={enhance} loading={enhancing} disabled={!input.trim() && !rawMessage.trim()}>
                ⚡
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── enhance panel ── */}
      <div className="hidden lg:flex flex-col w-80 xl:w-96 border-l border-zinc-800 p-4 overflow-y-auto">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-4">Prompt Enhancer</p>
        <EnhancedPreview
          original={rawMessage}
          result={enhancedResult}
          loading={enhancing}
          industry={industry}
          tone={tone}
          onIndustryChange={setIndustry}
          onToneChange={setTone}
          onEnhance={enhance}
          onSend={() => setShowSendPanel(true)}
        />
      </div>

      {/* send panel modal */}
      {showSendPanel && (
        <SendPanel
          enhancedResult={enhancedResult}
          industry={industry}
          onClose={() => setShowSendPanel(false)}
          onSent={(id) => {
            setShowSendPanel(false);
            toast(`Campaign launched! ID: ${id.slice(0, 8)}`, "success");
          }}
        />
      )}
    </div>
  );
}
