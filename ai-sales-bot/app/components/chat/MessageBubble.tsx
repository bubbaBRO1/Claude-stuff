import type { ChatMsg } from "@/types";

interface Props {
  msg: ChatMsg;
}

export default function MessageBubble({ msg }: Props) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
          isUser
            ? "bg-zinc-700 text-zinc-200"
            : "bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/30"
        }`}
      >
        {isUser ? "U" : "M"}
      </div>
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-lg text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-zinc-800 text-zinc-100 rounded-tr-none"
            : "bg-[#00ff88]/8 border border-[#00ff88]/15 text-zinc-100 rounded-tl-none"
        }`}
      >
        {msg.content}
      </div>
    </div>
  );
}

export function StreamingBubble({ text }: { text: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/30">
        M
      </div>
      <div className="max-w-[75%] px-4 py-2.5 rounded-lg rounded-tl-none text-sm leading-relaxed whitespace-pre-wrap bg-[#00ff88]/8 border border-[#00ff88]/15 text-zinc-100">
        {text || <span className="inline-block w-2 h-4 bg-[#00ff88] animate-pulse" />}
      </div>
    </div>
  );
}
