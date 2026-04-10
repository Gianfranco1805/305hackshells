"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { DocumentLanguage } from "@/types";
import { useLanguage } from "@/lib/contexts/LanguageContext";

export default function UploadPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [, setMediaStream] = useState<MediaStream | null>(null);
  const [language] = useState<DocumentLanguage>("en");

  const stopCamera = useCallback(() => {
    setMediaStream((currentStream) => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
      return null;
    });
    setIsCameraOpen(false);
  }, []);

  const openCamera = useCallback(async () => {
    setIsCameraOpen(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      setMediaStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert(
        t(
          "Could not access camera. Please check permissions.",
          "No se pudo acceder a la camara. Revisa los permisos.",
        ),
      );
      setIsCameraOpen(false);
    }
  }, [t]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "camera") {
      void openCamera();
    }

    return () => stopCamera();
  }, [openCamera, stopCamera]);

  function sanitizeFilename(name: string) {
    const normalized = name.normalize("NFKD").replace(/[^\x00-\x7F]/g, "");
    const cleaned = normalized.replace(/[^A-Za-z0-9._-]+/g, "_");
    return cleaned || `document_${Date.now()}`;
  }

  async function uploadFile(file: File) {
    try {
      setIsUploading(true);
      setUploadError("");

      const safeFileName = sanitizeFilename(file.name);
      const uploadFileObject =
        safeFileName === file.name
          ? file
          : new File([file], safeFileName, { type: file.type });

      const formData = new FormData();
      formData.append("file", uploadFileObject);
      formData.append("language", language);
      formData.append("title", safeFileName.replace(/\.[^.]+$/, ""));

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as
        | { data?: unknown; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Upload failed.");
      }

      router.push("/documents");
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Upload failed unexpectedly.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  async function processFile(file: File) {
    await uploadFile(file);
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setIsDragging(false);

    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      void processFile(event.dataTransfer.files[0]);
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files && event.target.files.length > 0) {
      void processFile(event.target.files[0]);
    }
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      setUploadError("Could not capture the photo.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setUploadError("Could not capture the photo.");
          return;
        }

        const photoFile = new File(
          [blob],
          `Photo_Capture_${new Date().getTime()}.jpg`,
          { type: "image/jpeg" },
        );

        stopCamera();
        await uploadFile(photoFile);
      },
      "image/jpeg",
      0.92,
    );
  }

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-black px-6 py-12 text-white">
      {isCameraOpen ? (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black p-6">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border-2 border-zinc-700 bg-zinc-900 shadow-2xl">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="h-auto w-full bg-black"
            />
            <canvas ref={canvasRef} className="hidden" />

            <div className="absolute bottom-0 flex w-full items-center justify-between bg-gradient-to-t from-black/80 to-transparent p-6">
              <button
                onClick={stopCamera}
                className="rounded-xl bg-zinc-800 px-6 py-3 font-semibold text-white transition hover:bg-zinc-700"
              >
                {t("Cancel", "Cancelar")}
              </button>

              <button
                onClick={capturePhoto}
                className="h-16 w-16 rounded-full border-4 border-zinc-400 bg-white shadow-[0_0_20px_rgba(255,255,255,0.4)] transition hover:scale-105"
              />

              <div className="w-[88px]" />
            </div>
          </div>
        </div>
      ) : null}

      <div className="mb-10 w-full max-w-2xl text-center">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-zinc-100 md:text-5xl">
          {t("Upload your document", "Sube tu documento")}
        </h1>
        <p className="text-lg text-zinc-400">
          {t(
            "Choose a PDF or image file from your device, or take a quick photo using your camera.",
            "Elige un archivo PDF o imagen de tu dispositivo, o toma una foto rapida con tu camara.",
          )}
        </p>
        {isUploading ? (
          <p className="mt-4 text-sm text-zinc-300">
            {t("Uploading document...", "Subiendo documento...")}
          </p>
        ) : null}
        {uploadError ? (
          <p className="mt-4 text-sm text-rose-400">{uploadError}</p>
        ) : null}
      </div>

      <div className="relative z-10 grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-12 transition-all duration-300 ${
            isDragging
              ? "scale-105 border-zinc-300 bg-zinc-900 shadow-xl shadow-zinc-800/50"
              : "border-zinc-800 bg-zinc-950 hover:border-zinc-500 hover:bg-zinc-900"
          }`}
        >
          <svg
            className="mb-4 h-12 w-12 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 002-2v-4M17 8l-5-5-5 5M12 3v12"
            />
          </svg>
          <h3 className="mb-2 text-xl font-semibold text-zinc-200">
            {t("Browse or Drop File", "Buscar o Soltar Archivo")}
          </h3>
          <p className="text-center text-sm text-zinc-500">
            {t("Supports PDF, DOC, DOCX, JPG, PNG", "Soporta PDF, DOC, DOCX, JPG, PNG")}
          </p>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,.doc,.docx,image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
          />
        </div>

        <div
          onClick={() => void openCamera()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-950 p-12 shadow-lg transition-all duration-300 hover:bg-zinc-900"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800 transition-transform hover:scale-110">
            <svg
              className="h-8 w-8 text-zinc-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-xl font-semibold text-zinc-200">
            {t("Take a Photo", "Tomar una Foto")}
          </h3>
          <p className="text-center text-sm text-zinc-500">
            {t(
              "Instantly scan a paper document",
              "Escanea al instante un documento fisico",
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
