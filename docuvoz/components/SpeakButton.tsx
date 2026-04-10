"use client";

import { useRef, useState } from "react";

type SpeakButtonProps = {
  text: string;
  defaultLabel: string;
  loadingLabel: string;
  voiceId?: string;
  className?: string;
};

export default function SpeakButton({
  text,
  defaultLabel,
  loadingLabel,
  voiceId,
  className,
}: SpeakButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function handleSpeak() {
    if (!text.trim()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, voiceId }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Unable to create audio.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Unable to create audio.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSpeak}
      disabled={isLoading}
      className={className || "inline-flex items-center justify-center rounded-xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:bg-zinc-400"}
    >
      {isLoading ? loadingLabel : defaultLabel}
    </button>
  );
}
