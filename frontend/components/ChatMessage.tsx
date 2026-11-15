"use client";

import { Bot, User, Clock, Zap } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  langue?: string;
  tools_used?: string[];
  timestamp: Date;
}

export default function ChatMessage({ role, content, langue, tools_used, timestamp }: ChatMessageProps) {
  const isUser = role === "user";

  const renderContent = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.trim() === "---") {
        return <hr key={i} className={`my-2 ${isUser ? "border-white/20" : "border-gray-100"}`} />;
      }
      const parsed = line.replace(
        /\*\*(.*?)\*\*/g,
        (_, m) => `<strong class="${isUser ? "text-white font-bold" : "text-[#1F5C99] font-semibold"}">${m}</strong>`
      );
      const isListItem = /^[-•]\s/.test(line.trim()) || /^\d+\.\s/.test(line.trim());
      if (line === "") return <div key={i} className="h-2" />;
      return (
        <p
          key={i}
          className={`leading-relaxed ${isListItem ? "pl-3" : ""} mb-0.5`}
          dangerouslySetInnerHTML={{ __html: parsed }}
        />
      );
    });
  };

  const langueLabel =
    langue === "wolof" ? "🗣️ Wolof" :
    langue === "mixte" ? "🔀 FR / Wolof" :
    "🇫🇷 Français";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300`}>

      {/* Avatar bot */}
      {!isUser && (
        <div className="shrink-0 w-9 h-9 rounded-2xl bg-gradient-to-br from-[#1F5C99] to-[#0f3d6e] flex items-center justify-center shadow-lg mt-1 ring-2 ring-white ring-offset-1">
          <Bot className="w-4.5 h-4.5 text-white" />
        </div>
      )}

      <div className={`max-w-[78%] flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>

        {/* Badge langue (messages utilisateur) */}
        {isUser && langue && (
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1F5C99] font-semibold border border-blue-100 self-end">
            {langueLabel}
          </span>
        )}

        {/* Bulle */}
        <div className={`rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-gradient-to-br from-[#1F5C99] to-[#0f3d6e] text-white rounded-tr-sm shadow-lg"
            : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-md hover:shadow-lg transition-shadow duration-200"
        }`}>

          <div className="text-sm leading-relaxed">
            {renderContent(content)}
          </div>

          {/* Outils MCP */}
          {!isUser && tools_used && tools_used.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-gray-100">
              <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-1.5 flex items-center gap-1">
                <Zap className="w-2.5 h-2.5" /> Serveurs MCP consultés
              </p>
              <div className="flex flex-wrap gap-1">
                {tools_used.map((tool, i) => (
                  <span
                    key={i}
                    className="text-[10px] bg-blue-50 text-[#1F5C99] px-2 py-0.5 rounded-full font-mono border border-blue-100"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Heure */}
          <div className={`flex items-center gap-1 mt-2 ${isUser ? "text-white/40" : "text-gray-300"}`}>
            <Clock className="w-2.5 h-2.5" />
            <span className="text-[10px]">
              {timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>
      </div>

      {/* Avatar utilisateur */}
      {isUser && (
        <div className="shrink-0 w-9 h-9 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center shadow-lg mt-1 ring-2 ring-white ring-offset-1">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
}
