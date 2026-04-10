"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import type { UploadDocumentResponse } from "@/types";

const DISPLAY_FONT =
  '"SF Pro Display", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif';

type UploadState = {
  isSubmitting: boolean;
  error: string | null;
  statusMessage: string | null;
};

export default function UploadClient() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>({
    isSubmitting: false,
    error: null,
    statusMessage: null,
  });

  useEffect(() => {
    if (searchParams.get("mode") === "camera") {
      cameraInputRef.current?.click();
    }
  }, [searchParams]);

  async function uploadFile(file: File) {
    setUploadState({
      isSubmitting: true,
      error: null,
      statusMessage:
        file.type === "application/pdf"
          ? t("Extracting PDF text...", "Extrayendo texto del PDF...")
          : t("Uploading document...", "Subiendo documento..."),
    });

    try {
      if (file.type === "application/pdf") {
        setUploadState({
          isSubmitting: true,
          error: null,
          statusMessage: t(
            "Uploading and translating PDF...",
            "Subiendo y traduciendo PDF...",
          ),
        });
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("language", "en");
      formData.append("translate_to_spanish", "true");

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as
        | UploadDocumentResponse
        | { error?: string };

      if (!response.ok || !("data" in payload)) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : t("Upload failed.", "La carga falló."),
        );
      }

      router.push(`/document/${payload.data.id}`);
      return;
    } catch (error) {
      console.error(error);
      setUploadState({
        isSubmitting: false,
        error:
          error instanceof Error
            ? error.message
            : t("Upload failed.", "La carga falló."),
        statusMessage: null,
      });
    }
  }

  function handleSelectedFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const [file] = fileList;
    void uploadFile(file);
  }

  return (
    <div
      className="flex flex-1 items-center justify-center px-6 py-16"
      style={{ background: "#000000", color: "#ffffff" }}
    >
      <div className="w-full max-w-[980px]">
        {/* Page heading */}
        <div className="mb-12 text-center">
          <h1
            className="font-semibold"
            style={{
              fontFamily: DISPLAY_FONT,
              fontSize: "clamp(40px, 5vw, 56px)",
              lineHeight: 1.07,
              letterSpacing: "-0.28px",
              color: "#ffffff",
            }}
          >
            {t("Upload your document", "Sube tu documento")}
          </h1>
          <p
            className="mx-auto mt-5 max-w-xl"
            style={{
              fontSize: "17px",
              lineHeight: 1.47,
              letterSpacing: "-0.374px",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            {t(
              "Choose a PDF or image from your device, or take a quick photo with your phone camera.",
              "Elige un PDF o imagen desde tu dispositivo, o toma una foto rápida con la cámara del teléfono.",
            )}
          </p>
        </div>

        {/* Upload cards */}
        <div className="grid gap-5 md:grid-cols-2">
          {/* File picker */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              handleSelectedFiles(event.dataTransfer.files);
            }}
            disabled={uploadState.isSubmitting}
            className="rounded-xl px-8 py-12 text-left transition-all"
            style={{
              background: isDragging ? "#1a1a1d" : "#272729",
              boxShadow: isDragging
                ? "rgba(0,113,227,0.4) 0px 0px 0px 2px, rgba(0,0,0,0.22) 3px 5px 30px 0px"
                : "rgba(0,0,0,0.22) 3px 5px 30px 0px",
              border: isDragging
                ? "1px solid rgba(0,113,227,0.5)"
                : "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              className="mb-6 inline-flex items-center justify-center rounded-xl"
              style={{
                width: "52px",
                height: "52px",
                background: "rgba(0,113,227,0.15)",
              }}
            >
              <svg
                style={{ color: "#0071e3" }}
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 16V4m0 0-4 4m4-4 4 4M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"
                />
              </svg>
            </div>
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
              {t("Browse or drop a file", "Busca o suelta un archivo")}
            </h2>
            <p
              className="mt-3"
              style={{
                fontSize: "14px",
                lineHeight: 1.43,
                letterSpacing: "-0.224px",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              {t(
                "Supports PDF, JPG, PNG, and WEBP. PDFs are parsed immediately before upload.",
                "Soporta PDF, JPG, PNG y WEBP. Los PDFs se procesan antes de subirlos.",
              )}
            </p>
          </button>

          {/* Camera */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploadState.isSubmitting}
            className="rounded-xl px-8 py-12 text-left transition-all"
            style={{
              background: "#272729",
              boxShadow: "rgba(0,0,0,0.22) 3px 5px 30px 0px",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            onMouseOver={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.border =
                "1px solid rgba(0,113,227,0.4)")
            }
            onMouseOut={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.border =
                "1px solid rgba(255,255,255,0.08)")
            }
          >
            <div
              className="mb-6 inline-flex items-center justify-center rounded-xl"
              style={{
                width: "52px",
                height: "52px",
                background: "rgba(0,113,227,0.15)",
              }}
            >
              <svg
                style={{ color: "#0071e3" }}
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 9a2 2 0 0 1 2-2h1.17a2 2 0 0 0 1.664-.89l.996-1.494A2 2 0 0 1 10.494 4h3.012a2 2 0 0 1 1.664.89l.996 1.494A2 2 0 0 0 17.83 7H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 13a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
            </div>
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
              {t("Take a photo", "Tomar una foto")}
            </h2>
            <p
              className="mt-3"
              style={{
                fontSize: "14px",
                lineHeight: 1.43,
                letterSpacing: "-0.224px",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              {t(
                "Use your phone camera for a quick scan of printed documents.",
                "Usa la cámara del teléfono para escanear rápidamente documentos impresos.",
              )}
            </p>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,image/jpeg,image/png,image/webp"
          onChange={(event) => handleSelectedFiles(event.target.files)}
        />

        <input
          ref={cameraInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          capture="environment"
          onChange={(event) => handleSelectedFiles(event.target.files)}
        />

        {/* Status / error */}
        {(uploadState.statusMessage || uploadState.error) && (
          <div
            className="mt-8 rounded-xl px-6 py-5"
            style={{
              background: "#272729",
              border: uploadState.error
                ? "1px solid rgba(255,69,58,0.35)"
                : "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {uploadState.statusMessage ? (
              <p
                style={{
                  fontSize: "14px",
                  lineHeight: 1.43,
                  letterSpacing: "-0.224px",
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                {uploadState.statusMessage}
              </p>
            ) : null}

            {uploadState.error ? (
              <p
                style={{
                  fontSize: "14px",
                  lineHeight: 1.43,
                  letterSpacing: "-0.224px",
                  color: "#ff453a",
                  marginTop: uploadState.statusMessage ? "8px" : undefined,
                }}
              >
                {uploadState.error}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
