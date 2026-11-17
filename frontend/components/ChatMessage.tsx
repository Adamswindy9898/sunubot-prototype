"use client";

import { useState } from "react";
import { Bot, User, Clock, Zap, ThumbsUp, ThumbsDown, Copy, Check } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  langue?: string;
  tools_used?: string[];
  timestamp: Date;
  darkMode?: boolean;
}

export default function ChatMessage({ role, content, langue, tools_used, timestamp, darkMode }: ChatMessageProps) {
  const isUser = role === "user";
  const [reaction, setReaction] = useState<"up" | "down" | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReaction = async (type: "up" | "down") => {
    const newReaction = reaction === type ? null : type;
    setReaction(newReaction);
    try {
      await fetch("/api/satisfaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "reaction", reaction: newReaction, message: content.substring(0, 100) }),
      });
    } catch {}
  };

  const renderContent = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.trim() === "---") {
        return <hr key={i} className={`my-2 ${isUser ? "border-white/20" : darkMode ? "border-white/10" : "border-gray-100"}`} />;
      }
      const parsed = line.replace(
        /\*\*(.*?)\*\*/g,
        (_, m) => `<strong class="${isUser ? "text-white font-bold" : darkMode ? "text-blue-300 font-semibold" : "text-[#1F5C99] font-semibold"}">${m}</strong>`
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
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300 group`}>

      {!isUser && (
        <div className="shrink-0 w-9 h-9 rounded-2xl bg-gradient-to-br from-[#1F5C99] to-[#0f3d6e] flex items-center justify-center shadow-lg mt-1 ring-2 ring-white ring-offset-1">
          <Bot className="w-4.5 h-4.5 text-white" />
        </div>
      )}

      <div className={`max-w-[78%] flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>

        {isUser && langue && (
          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border self-end ${darkMode ? "bg-blue-900/30 text-blue-300 border-blue-700/30" : "bg-blue-50 text-[#1F5C99] border-blue-100"}`}>
            {langueLabel}
          </span>
        )}

        <div className={`rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-gradient-to-br from-[#1F5C99] to-[#0f3d6e] text-white rounded-tr-sm shadow-lg"
            : darkMode
              ? "bg-[#252547] border border-white/10 text-gray-200 rounded-tl-sm shadow-md"
              : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-md hover:shadow-lg transition-shadow duration-200"
        }`}>

          <div className="text-sm leading-relaxed">
            {renderContent(content)}
          </div>

          {!isUser && tools_used && tools_used.length > 0 && (
            <div className={`mt-3 pt-2.5 border-t ${darkMode ? "border-white/10" : "border-gray-100"}`}>
              <p className={`text-[9px] uppercase tracking-widest font-bold mb-1.5 flex items-center gap-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                <Zap className="w-2.5 h-2.5" /> Serveurs MCP consultés
              </p>
              <div className="flex flex-wrap gap-1">
                {tools_used.map((tool, i) => (
                  <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${darkMode ? "bg-blue-900/30 text-blue-300 border-blue-700/30" : "bg-blue-50 text-[#1F5C99] border-blue-100"}`}>
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className={`flex items-center gap-1 mt-2 ${isUser ? "text-white/40" : darkMode ? "text-gray-600" : "text-gray-300"}`}>
            <Clock className="w-2.5 h-2.5" />
            <span className="text-[10px]">
              {timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>

        {/* Actions : reactions + copier (bot messages only) */}
        {!isUser && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-1">
            <button
              onClick={() => handleReaction("up")}
              className={`p-1 rounded-md transition ${reaction === "up" ? "bg-green-100 text-green-600" : darkMode ? "hover:bg-white/10 text-gray-500" : "hover:bg-gray-100 text-gray-400"}`}
              aria-label="Bonne réponse"
              title="Bonne réponse"
            >
              <ThumbsUp className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleReaction("down")}
              className={`p-1 rounded-md transition ${reaction === "down" ? "bg-red-100 text-red-600" : darkMode ? "hover:bg-white/10 text-gray-500" : "hover:bg-gray-100 text-gray-400"}`}
              aria-label="Mauvaise réponse"
              title="Mauvaise réponse"
            >
              <ThumbsDown className="w-3 h-3" />
            </button>
            <button
              onClick={handleCopy}
              className={`p-1 rounded-md transition ${copied ? "text-green-500" : darkMode ? "hover:bg-white/10 text-gray-500" : "hover:bg-gray-100 text-gray-400"}`}
              aria-label="Copier le message"
              title="Copier"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        )}
      </div>

      {isUser && (
        <div className="shrink-0 w-9 h-9 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center shadow-lg mt-1 ring-2 ring-white ring-offset-1">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
}
