"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from "lucide-react";

// Déclarations pour la Web Speech API (non incluses dans lib TypeScript par défaut)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  langue?: string;
  disabled?: boolean;
}

export default function VoiceInput({ onTranscript, langue, disabled }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRec) setSupported(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    setInterim("");
  }, []);

  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    const recognition = new SpeechRec();
    // Wolof non supporté nativement → on utilise fr-FR (meilleure reconnaissance pour les mots mélangés)
    recognition.lang = langue === "wolof" ? "fr-FR" : "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interimText = "";
      let finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t;
        else interimText += t;
      }
      setInterim(interimText);
      if (finalText) {
        onTranscript(finalText.trim());
        stopListening();
      }
    };

    recognition.onerror = () => stopListening();
    recognition.onend = () => { setIsListening(false); setInterim(""); };

    recognitionRef.current = recognition;
    recognition.start();
  }, [langue, onTranscript, stopListening]);

  const toggle = () => {
    if (isListening) stopListening();
    else startListening();
  };

  if (!supported) return null;

  return (
    <div className="relative flex items-center">
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        title={isListening ? "Arrêter l'écoute" : (langue === "wolof" ? "Wax ci mikro bi" : "Parler au micro")}
        className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all ${
          isListening
            ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200"
            : "bg-gray-100 hover:bg-gray-200 text-gray-500"
        } disabled:opacity-40`}
      >
        {isListening ? (
          <>
            <MicOff className="w-4 h-4" />
            {/* Animation pulse */}
            <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
          </>
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>

      {/* Texte intermédiaire (transcription en cours) */}
      {interim && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap max-w-[200px] truncate">
          {interim}
        </div>
      )}
    </div>
  );
}

// ─── Text-to-Speech (synthèse vocale) ──────────────────────────────────────

interface TTSButtonProps {
  text: string;
  langue?: string;
}

export function TTSButton({ text, langue }: TTSButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported] = useState(() => typeof window !== "undefined" && "speechSynthesis" in window);

  const speak = () => {
    if (!supported || !text) return;
    window.speechSynthesis.cancel();

    // Nettoyer le markdown pour la lecture
    const clean = text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/`(.*?)`/g, "$1")
      .replace(/#{1,6}\s/g, "")
      .replace(/>\s/g, "")
      .replace(/\n/g, ". ")
      .slice(0, 500); // Limiter pour éviter les lectures trop longues

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = "fr-FR";
    utterance.rate = 0.9;
    utterance.pitch = 1;

    // Essayer de trouver une voix française
    const voices = window.speechSynthesis.getVoices();
    const frVoice = voices.find((v) => v.lang.startsWith("fr"));
    if (frVoice) utterance.voice = frVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  if (!supported) return null;

  return (
    <button
      onClick={isSpeaking ? stop : speak}
      title={isSpeaking ? "Arrêter" : (langue === "wolof" ? "Dégël ci baat" : "Écouter ce message")}
      className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
        isSpeaking ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-gray-600"
      }`}
    >
      {isSpeaking
        ? <VolumeX className="w-3.5 h-3.5" />
        : <Volume2 className="w-3.5 h-3.5" />
      }
    </button>
  );
}

// ─── Traduction FR ↔ Wolof (via LibreTranslate ou simulation) ──────────────

interface TranslationBadgeProps {
  text: string;
  sourceLangue: string;
}

const TRADUCTIONS_COMMUNES: Record<string, string> = {
  "bonjour": "Mangui fi",
  "merci": "Jereejef",
  "comment ça va": "Na nga def?",
  "je veux": "Dama begg",
  "acte de naissance": "kàrt bëccëg",
  "carte d'identité": "kàrt boppam",
  "inscription": "bind",
  "demande": "laaj",
  "document": "kayit",
  "bourse": "bourse njang",
  "impôts": "wàll",
  "santé": "wer gi",
  "école": "daara",
  "aide": "ndimbal",
  "trouver": "seet",
  "payer": "fey",
  "suivre": "topp",
  "voir": "xool",
  "mon": "sama",
};

export function TranslationHint({ text, sourceLangue }: TranslationBadgeProps) {
  const [translation, setTranslation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shown, setShown] = useState(false);

  const translate = async () => {
    if (shown) { setShown(false); return; }
    setLoading(true);

    // Chercher des traductions locales communes
    const lower = text.toLowerCase();
    const found = Object.entries(TRADUCTIONS_COMMUNES).find(([fr]) => lower.includes(fr));
    if (found) {
      setTranslation(sourceLangue === "francais"
        ? `Wolof : "${found[1]}"`
        : `Français : "${found[0]}"`
      );
      setShown(true);
      setLoading(false);
      return;
    }

    // Simulation d'une traduction basique (en production : appel LibreTranslate)
    await new Promise((r) => setTimeout(r, 300));
    setTranslation(
      sourceLangue === "francais"
        ? "Traduction wolof non disponible pour ce texte."
        : "Traduction française non disponible pour ce texte."
    );
    setShown(true);
    setLoading(false);
  };

  return (
    <div className="inline-flex items-center gap-1">
      <button
        onClick={translate}
        className="text-[9px] text-gray-400 hover:text-blue-500 border border-gray-200 hover:border-blue-200 px-1.5 py-0.5 rounded transition flex items-center gap-1"
        title={sourceLangue === "francais" ? "Voir en wolof" : "Voir en français"}
      >
        {loading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : "🌐"}
        {sourceLangue === "francais" ? "WO" : "FR"}
      </button>
      {shown && translation && (
        <span className="text-[9px] text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
          {translation}
        </span>
      )}
    </div>
  );
}
