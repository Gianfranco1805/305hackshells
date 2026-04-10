"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SpeakButton from "@/components/SpeakButton";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import type { DocumentViewerData } from "@/types";

const DISPLAY_FONT =
  '"SF Pro Display", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif';

const VOICE_OPTIONS = [
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Clara (Femenino)" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Miguel (Masculino)" },
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rosa (Femenino)" },
];

type DocumentPageClientProps = {
  document: DocumentViewerData;
};

type ChatEntry = {
  role: "user" | "assistant";
  message: string;
};

export default function DocumentPageClient({
  document,
}: DocumentPageClientProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [isTranslating, setIsTranslating] = useState(false);
  const [isDeletingTranslation, setIsDeletingTranslation] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  const initialChatMessages = useMemo<ChatEntry[]>(() => {
    if (document.summaryEs || document.summaryPoints.length > 0) {
      const summaryParts: string[] = [];
      if (document.summaryEs) summaryParts.push(document.summaryEs);
      if (document.summaryPoints.length > 0) {
        summaryParts.push(
          document.summaryPoints.map((point) => `• ${point}`).join("\n"),
        );
      }
      return [{ role: "assistant", message: summaryParts.join("\n\n") }];
    }
    return [
      {
        role: "assistant",
        message: t(
          "Ask me anything about this document and I will answer using the extracted text and translation when available.",
          "Hazme cualquier pregunta sobre este documento y respondere usando el texto extraido y la traduccion cuando exista.",
        ),
      },
    ];
  }, [document.summaryEs, document.summaryPoints, t]);

  const [chatMessages, setChatMessages] =
    useState<ChatEntry[]>(initialChatMessages);
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(
    VOICE_OPTIONS[0].id,
  );

  useEffect(() => {
    const savedVoice = localStorage.getItem("docuvoz_voice_id");
    if (savedVoice) setSelectedVoiceId(savedVoice);
  }, []);

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedVoiceId(val);
    localStorage.setItem("docuvoz_voice_id", val);
  };

  async function handleTranslate() {
    try {
      setIsTranslating(true);
      setTranslateError(null);

      const response = await fetch(`/api/documents/${document.id}/translate`, {
        method: "POST",
      });

      const payload = (await response.json()) as
        | { data?: unknown; error?: string }
        | undefined;

      if (!response.ok) {
        throw new Error(payload?.error || "Translation failed.");
      }

      router.refresh();
    } catch (error) {
      setTranslateError(
        error instanceof Error ? error.message : "Translation failed.",
      );
    } finally {
      setIsTranslating(false);
    }
  }

  async function handleDeleteTranslation() {
    try {
      setIsDeletingTranslation(true);
      setTranslateError(null);

      const response = await fetch(
        `/api/documents/${document.id}/translation`,
        { method: "DELETE" },
      );

      const payload = (await response.json()) as
        | { data?: unknown; error?: string }
        | undefined;

      if (!response.ok) {
        throw new Error(payload?.error || "Translation delete failed.");
      }

      router.refresh();
    } catch (error) {
      setTranslateError(
        error instanceof Error ? error.message : "Translation delete failed.",
      );
    } finally {
      setIsDeletingTranslation(false);
    }
  }

  async function handleSendChat() {
    const message = chatInput.trim();
    if (!message) return;

    const previousMessages = chatMessages;
    const nextMessages: ChatEntry[] = [
      ...previousMessages,
      { role: "user", message },
    ];

    try {
      setIsSendingChat(true);
      setChatError(null);
      setChatMessages(nextMessages);
      setChatInput("");

      const response = await fetch(`/api/documents/${document.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          conversationHistory: previousMessages,
        }),
      });

      const payload = (await response.json()) as
        | { data?: { text?: string }; error?: string }
        | undefined;

      if (!response.ok || !payload?.data?.text) {
        throw new Error(payload?.error || "We could not answer that question.");
      }

      setChatMessages((current) => [
        ...current,
        { role: "assistant", message: payload.data?.text || "" },
      ]);
    } catch (error) {
      setChatError(
        error instanceof Error
          ? error.message
          : "We could not answer that question.",
      );
      setChatMessages(previousMessages);
      setChatInput(message);
    } finally {
      setIsSendingChat(false);
    }
  }

  const showProcessingState =
    document.translationStatus === "processing" ||
    document.translationStatus === "not_started";
  const showErrorState = document.translationStatus === "failed";
  const translatedAudioText = document.summaryEs || document.translatedText;

  return (
    <div
      className="flex flex-1 items-start justify-center px-6 py-12"
      style={{ background: "#000000", color: "#ffffff" }}
    >
      <div className="w-full max-w-[980px]">
        {/* Page header */}
        <div
          className="mb-8 flex flex-col gap-4 pb-6 md:flex-row md:items-end md:justify-between"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}
        >
          <div>
            <p
              style={{
                fontSize: "12px",
                letterSpacing: "0.25em",
                color: "rgba(255,255,255,0.4)",
                textTransform: "uppercase",
              }}
            >
              {t("Document viewer", "Visor de documento")}
            </p>
            <h1
              className="mt-3 font-semibold"
              style={{
                fontFamily: DISPLAY_FONT,
                fontSize: "40px",
                lineHeight: 1.1,
                letterSpacing: "-0.28px",
                color: "#ffffff",
              }}
            >
              {document.fileName}
            </h1>
            <p
              className="mt-2"
              style={{
                fontSize: "12px",
                lineHeight: 1.33,
                letterSpacing: "-0.12px",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              {new Date(document.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center transition-opacity hover:opacity-80"
              style={{
                fontSize: "14px",
                letterSpacing: "-0.224px",
                color: "#2997ff",
                padding: "7px 16px",
                borderRadius: "980px",
                border: "1px solid rgba(41,151,255,0.4)",
              }}
            >
              {t("Back to dashboard", "Volver al panel")}
            </Link>

            {document.canTranslate && !document.translatedPdfUrl ? (
              <button
                type="button"
                onClick={() => void handleTranslate()}
                disabled={isTranslating}
                className="inline-flex items-center justify-center text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  fontSize: "14px",
                  letterSpacing: "-0.224px",
                  background: "#0071e3",
                  padding: "7px 16px",
                  borderRadius: "8px",
                }}
              >
                {isTranslating
                  ? t("Translating...", "Traduciendo...")
                  : t("Create Spanish PDF", "Crear PDF en Español")}
              </button>
            ) : null}

            {translatedAudioText ? (
              <div className="flex items-center gap-2">
                <select
                  value={selectedVoiceId}
                  onChange={handleVoiceChange}
                  className="outline-none transition-colors"
                  style={{
                    fontSize: "14px",
                    letterSpacing: "-0.224px",
                    color: "rgba(255,255,255,0.7)",
                    background: "#272729",
                    padding: "7px 12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.12)",
                    height: "38px",
                  }}
                >
                  {VOICE_OPTIONS.map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      {voice.name}
                    </option>
                  ))}
                </select>

                <SpeakButton
                  text={translatedAudioText}
                  voiceId={selectedVoiceId}
                  defaultLabel={t("Read in Spanish", "Leer en Español")}
                  loadingLabel={t(
                    "Generating audio...",
                    "Generando audio...",
                  )}
                />
              </div>
            ) : null}

            {document.canTranslate &&
            (document.translatedPdfUrl || document.translatedText) ? (
              <button
                type="button"
                onClick={() => void handleDeleteTranslation()}
                disabled={isDeletingTranslation}
                className="inline-flex items-center justify-center transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  fontSize: "14px",
                  letterSpacing: "-0.224px",
                  color: "#ff453a",
                  padding: "7px 16px",
                  borderRadius: "980px",
                  border: "1px solid rgba(255,69,58,0.35)",
                  background: "rgba(255,69,58,0.1)",
                }}
              >
                {isDeletingTranslation
                  ? t("Deleting translation...", "Eliminando traduccion...")
                  : t("Delete translation", "Eliminar traduccion")}
              </button>
            ) : null}
          </div>
        </div>

        {/* Translate error */}
        {translateError ? (
          <section
            className="mb-6 rounded-xl px-6 py-5"
            style={{
              background: "rgba(255,69,58,0.1)",
              border: "1px solid rgba(255,69,58,0.35)",
            }}
          >
            <p
              style={{
                fontSize: "14px",
                lineHeight: 1.43,
                letterSpacing: "-0.224px",
                color: "#ff453a",
              }}
            >
              {translateError}
            </p>
          </section>
        ) : null}

        {/* Processing state */}
        {showProcessingState ? (
          <section
            className="rounded-xl px-8 py-10 mb-6"
            style={{
              background: "rgba(255,159,10,0.1)",
              border: "1px solid rgba(255,159,10,0.3)",
            }}
          >
            <h2
              className="font-semibold"
              style={{
                fontFamily: DISPLAY_FONT,
                fontSize: "21px",
                lineHeight: 1.19,
                letterSpacing: "0.231px",
                color: "#ff9f0a",
              }}
            >
              {t(
                "Your document is still processing",
                "Tu documento sigue procesandose",
              )}
            </h2>
            <p
              className="mt-3 max-w-2xl"
              style={{
                fontSize: "14px",
                lineHeight: 1.43,
                letterSpacing: "-0.224px",
                color: "rgba(255,159,10,0.8)",
              }}
            >
              {t(
                "The original file is saved. We are preparing the Spanish translation and translated PDF.",
                "El archivo original ya esta guardado. Estamos preparando la traduccion al Español y el PDF traducido.",
              )}
            </p>
          </section>
        ) : null}

        {/* Error state */}
        {showErrorState ? (
          <section
            className="rounded-xl px-8 py-10 mb-6"
            style={{
              background: "rgba(255,69,58,0.1)",
              border: "1px solid rgba(255,69,58,0.35)",
            }}
          >
            <h2
              className="font-semibold"
              style={{
                fontFamily: DISPLAY_FONT,
                fontSize: "21px",
                lineHeight: 1.19,
                letterSpacing: "0.231px",
                color: "#ff453a",
              }}
            >
              {t("We hit a processing error", "Tuvimos un error al procesar")}
            </h2>
            <p
              className="mt-3 max-w-2xl"
              style={{
                fontSize: "14px",
                lineHeight: 1.43,
                letterSpacing: "-0.224px",
                color: "rgba(255,69,58,0.8)",
              }}
            >
              {document.errorMessage ??
                t(
                  "Please try uploading the document again.",
                  "Vuelve a intentar subir el documento.",
                )}
            </p>
          </section>
        ) : null}

        {/* PDF viewers */}
        <div className="grid gap-5 lg:grid-cols-2">
          <section
            className="rounded-xl px-6 py-6"
            style={{
              background: "#272729",
              boxShadow: "rgba(0,0,0,0.22) 3px 5px 30px 0px",
            }}
          >
            <h2
              className="font-bold"
              style={{
                fontFamily: DISPLAY_FONT,
                fontSize: "21px",
                lineHeight: 1.19,
                letterSpacing: "0.231px",
                color: "#ffffff",
              }}
            >
              {t("Original PDF", "PDF original")}
            </h2>
            <div
              className="mt-4 overflow-hidden rounded-lg"
              style={{
                height: "70vh",
                background: "#000000",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {document.originalPdfUrl ? (
                <iframe
                  title="Original PDF"
                  src={document.originalPdfUrl}
                  className="h-full w-full"
                />
              ) : (
                <div
                  className="flex h-full items-center justify-center px-6 text-center"
                  style={{
                    fontSize: "14px",
                    lineHeight: 1.43,
                    letterSpacing: "-0.224px",
                    color: "rgba(255,255,255,0.4)",
                  }}
                >
                  {document.mimeType === "application/pdf"
                    ? t(
                        "We could not load the original PDF preview.",
                        "No pudimos cargar la vista previa del PDF original.",
                      )
                    : t(
                        "This document type does not have a PDF preview yet.",
                        "Este tipo de documento todavia no tiene vista previa en PDF.",
                      )}
                </div>
              )}
            </div>
          </section>

          <section
            className="rounded-xl px-6 py-6"
            style={{
              background: "#272729",
              boxShadow: "rgba(0,0,0,0.22) 3px 5px 30px 0px",
            }}
          >
            <h2
              className="font-bold"
              style={{
                fontFamily: DISPLAY_FONT,
                fontSize: "21px",
                lineHeight: 1.19,
                letterSpacing: "0.231px",
                color: "#ffffff",
              }}
            >
              {t("Spanish PDF", "PDF en Español")}
            </h2>
            <div
              className="mt-4 overflow-hidden rounded-lg"
              style={{
                height: "70vh",
                background: "#000000",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {document.translatedPdfUrl ? (
                <iframe
                  title="Spanish PDF"
                  src={document.translatedPdfUrl}
                  className="h-full w-full"
                />
              ) : (
                <div
                  className="flex h-full items-center justify-center px-6 text-center"
                  style={{
                    fontSize: "14px",
                    lineHeight: 1.43,
                    letterSpacing: "-0.224px",
                    color: "rgba(255,255,255,0.4)",
                  }}
                >
                  {document.canTranslate
                    ? t(
                        "Your translated Spanish PDF will appear here once translation finishes.",
                        "Tu PDF traducido al Español aparecera aqui cuando termine la traduccion.",
                      )
                    : t(
                        "This older document flow does not have a generated Spanish PDF yet.",
                        "Este flujo anterior todavia no tiene un PDF en Español generado.",
                      )}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Text panels */}
        {(document.originalText || document.translatedText) && (
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {document.originalText ? (
              <section
                className="rounded-xl px-6 py-6"
                style={{
                  background: "#272729",
                  boxShadow: "rgba(0,0,0,0.22) 3px 5px 30px 0px",
                }}
              >
                <h2
                  className="font-bold"
                  style={{
                    fontFamily: DISPLAY_FONT,
                    fontSize: "21px",
                    lineHeight: 1.19,
                    letterSpacing: "0.231px",
                    color: "#ffffff",
                  }}
                >
                  {t("Original text", "Texto original")}
                </h2>
                <div
                  className="mt-4 whitespace-pre-wrap"
                  style={{
                    fontSize: "14px",
                    lineHeight: 1.47,
                    letterSpacing: "-0.224px",
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  {document.originalText}
                </div>
              </section>
            ) : null}

            {document.translatedText ? (
              <section
                className="rounded-xl px-6 py-6"
                style={{
                  background: "#272729",
                  boxShadow: "rgba(0,0,0,0.22) 3px 5px 30px 0px",
                }}
              >
                <h2
                  className="font-bold"
                  style={{
                    fontFamily: DISPLAY_FONT,
                    fontSize: "21px",
                    lineHeight: 1.19,
                    letterSpacing: "0.231px",
                    color: "#ffffff",
                  }}
                >
                  {t(
                    "Spanish translation text",
                    "Texto traducido al Español",
                  )}
                </h2>
                <div
                  className="mt-4 whitespace-pre-wrap"
                  style={{
                    fontSize: "14px",
                    lineHeight: 1.47,
                    letterSpacing: "-0.224px",
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  {document.translatedText}
                </div>
              </section>
            ) : null}
          </div>
        )}

        {/* Chat */}
        <section
          className="mt-5 rounded-xl px-6 py-6"
          style={{
            background: "#272729",
            boxShadow: "rgba(0,0,0,0.22) 3px 5px 30px 0px",
          }}
        >
          <div
            className="flex flex-col gap-2 pb-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
          >
            <h2
              className="font-bold"
              style={{
                fontFamily: DISPLAY_FONT,
                fontSize: "21px",
                lineHeight: 1.19,
                letterSpacing: "0.231px",
                color: "#ffffff",
              }}
            >
              {t("Ask About This Document", "Pregunta sobre este documento")}
            </h2>
            <p
              style={{
                fontSize: "14px",
                lineHeight: 1.43,
                letterSpacing: "-0.224px",
                color: "rgba(255,255,255,0.45)",
              }}
            >
              {t(
                "The summary appears here first, and you can keep chatting with Gemini below.",
                "El resumen aparece aqui primero, y luego puedes seguir chateando con Gemini abajo.",
              )}
            </p>
          </div>

          <div className="mt-5 max-h-[28rem] space-y-4 overflow-y-auto pr-1">
            {chatMessages.map((entry, index) => (
              <div
                key={`${entry.role}-${index}`}
                className="rounded-xl px-4 py-3"
                style={
                  entry.role === "assistant"
                    ? {
                        marginRight: "2rem",
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }
                    : {
                        marginLeft: "2rem",
                        background: "#0071e3",
                      }
                }
              >
                <p
                  className="mb-1 font-semibold uppercase"
                  style={{
                    fontSize: "11px",
                    letterSpacing: "0.2em",
                    opacity: 0.6,
                    color: "#ffffff",
                  }}
                >
                  {entry.role === "assistant"
                    ? t("Assistant", "Asistente")
                    : t("You", "Tu")}
                </p>
                <div
                  className="whitespace-pre-wrap"
                  style={{
                    fontSize: "14px",
                    lineHeight: 1.47,
                    letterSpacing: "-0.224px",
                    color: "#ffffff",
                  }}
                >
                  {entry.message}
                </div>
              </div>
            ))}
          </div>

          {chatError ? (
            <div
              className="mt-4 rounded-xl px-4 py-3"
              style={{
                background: "rgba(255,69,58,0.1)",
                border: "1px solid rgba(255,69,58,0.35)",
                fontSize: "14px",
                lineHeight: 1.43,
                letterSpacing: "-0.224px",
                color: "#ff453a",
              }}
            >
              {chatError}
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <textarea
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSendChat();
                }
              }}
              rows={3}
              placeholder={t(
                "Ask about deadlines, fees, obligations, or anything else in this document...",
                "Pregunta sobre fechas limite, pagos, obligaciones o cualquier otra cosa en este documento...",
              )}
              className="flex-1 outline-none resize-none"
              style={{
                minHeight: "5.5rem",
                background: "#000000",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "8px",
                padding: "12px 16px",
                fontSize: "14px",
                lineHeight: 1.47,
                letterSpacing: "-0.224px",
                color: "#ffffff",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "#0071e3")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor =
                  "rgba(255,255,255,0.12)")
              }
            />
            <button
              type="button"
              onClick={() => void handleSendChat()}
              disabled={isSendingChat || !chatInput.trim()}
              className="inline-flex items-center justify-center text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                fontSize: "14px",
                letterSpacing: "-0.224px",
                background: "#0071e3",
                padding: "0 20px",
                height: "48px",
                borderRadius: "8px",
                whiteSpace: "nowrap",
              }}
            >
              {isSendingChat
                ? t("Sending...", "Enviando...")
                : t("Send", "Enviar")}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
