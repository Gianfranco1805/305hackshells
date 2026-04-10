"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import type { DocumentsPageItem } from "@/types";

type LoadState = "loading" | "ready" | "error";

function formatStatus(item: DocumentsPageItem) {
  if (item.hasTranslation) {
    return "translated";
  }

  if (item.translationStatus === "processing") {
    return "processing";
  }

  if (item.translationStatus === "failed") {
    return "failed";
  }

  return "uploaded";
}

function getStatusClasses(status: string) {
  if (status === "translated") {
    return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30";
  }

  if (status === "failed") {
    return "bg-rose-500/15 text-rose-300 border border-rose-500/30";
  }

  if (status === "processing") {
    return "bg-amber-500/15 text-amber-200 border border-amber-500/30";
  }

  return "bg-zinc-700/40 text-zinc-300 border border-zinc-700";
}

export default function DocumentsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentsPageItem[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDocuments() {
      try {
        setLoadState("loading");
        setError(null);

        const response = await fetch("/api/documents");
        const payload = (await response.json()) as
          | { data?: DocumentsPageItem[]; error?: string }
          | undefined;

        if (!response.ok || !payload?.data) {
          throw new Error(payload?.error || "Unable to load documents.");
        }

        if (!active) {
          return;
        }

        const sorted = [...payload.data].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        setDocuments(sorted);
        setLoadState("ready");
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load documents.",
        );
        setLoadState("error");
      }
    }

    void loadDocuments();

    return () => {
      active = false;
    };
  }, []);

  async function handleDelete(id: string) {
    try {
      setDeletingId(id);

      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to delete document.");
      }

      setDocuments((current) => current.filter((document) => document.id !== id));
      router.refresh();
    } catch (deleteError) {
      alert(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete document.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const translatedDocs = documents.filter((document) => document.hasTranslation);
  const uploadedDocs = documents.filter((document) => !document.hasTranslation);

  const renderCard = (document: DocumentsPageItem) => {
    const status = formatStatus(document);

    return (
      <article
        key={document.id}
        className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950 p-5 shadow-lg shadow-black/20"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3
              className={`truncate text-lg font-semibold ${
                document.hasTranslation ? "text-emerald-300" : "text-zinc-100"
              }`}
              title={document.fileName}
            >
              {document.fileName}
            </h3>
            <p className="mt-2 text-xs text-zinc-500">
              {new Date(document.createdAt).toLocaleString()}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${getStatusClasses(
              status,
            )}`}
          >
            {status}
          </span>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-black/40 px-4 py-8 text-center text-sm text-zinc-500">
          {document.hasTranslation
            ? t(
                "Spanish PDF and summary are ready.",
                "El PDF en espanol y el resumen ya estan listos.",
              )
            : t(
                "Open the document to translate, preview, or manage it.",
                "Abre el documento para traducirlo, previsualizarlo o administrarlo.",
              )}
        </div>

        <div className="mt-4 flex gap-3">
          <Link
            href={`/document/${document.id}`}
            className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900"
          >
            {document.hasTranslation
              ? t("Open translation", "Abrir traduccion")
              : t("Open document", "Abrir documento")}
          </Link>
          <button
            type="button"
            onClick={() => void handleDelete(document.id)}
            disabled={deletingId === document.id}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-rose-500/15 px-4 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {deletingId === document.id
              ? t("Deleting...", "Eliminando...")
              : t("Delete", "Eliminar")}
          </button>
        </div>
      </article>
    );
  };

  return (
    <div className="flex min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-10 flex flex-col gap-4 border-b border-zinc-800 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-zinc-100">
              {t("My documents", "Mis documentos")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
              {t(
                "View your real uploads and completed Spanish translations here.",
                "Aqui puedes ver tus cargas reales y las traducciones completas al espanol.",
              )}
            </p>
          </div>

          <Link
            href="/upload"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-zinc-100 px-5 text-sm font-semibold text-black transition hover:bg-white"
          >
            {t("Upload another", "Subir otro")}
          </Link>
        </div>

        {loadState === "loading" ? (
          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950 px-8 py-12 text-center text-zinc-400">
            {t("Loading documents...", "Cargando documentos...")}
          </div>
        ) : null}

        {loadState === "error" ? (
          <div className="rounded-[2rem] border border-rose-500/30 bg-rose-500/10 px-8 py-12 text-center">
            <p className="text-sm leading-7 text-rose-100">
              {error ?? t("Unable to load documents.", "No se pudieron cargar los documentos.")}
            </p>
          </div>
        ) : null}

        {loadState === "ready" && documents.length === 0 ? (
          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950 px-8 py-12 text-center">
            <p className="text-lg font-semibold text-zinc-200">
              {t("No documents yet.", "Todavia no hay documentos.")}
            </p>
            <p className="mt-3 text-sm leading-7 text-zinc-500">
              {t(
                "Upload your first PDF or photo to start building your document history.",
                "Sube tu primer PDF o foto para empezar tu historial de documentos.",
              )}
            </p>
          </div>
        ) : null}

        {loadState === "ready" && documents.length > 0 ? (
          <div className="space-y-12">
            <section>
              <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-zinc-200">
                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                {t("Uploaded Docs", "Documentos subidos")}
              </h2>
              {uploadedDocs.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {uploadedDocs.map(renderCard)}
                </div>
              ) : (
                <div className="rounded-[1.75rem] border border-zinc-800/60 bg-zinc-950/60 px-6 py-8 text-sm text-zinc-500">
                  {t(
                    "No untranslated uploads are waiting right now.",
                    "No hay cargas sin traducir en este momento.",
                  )}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-zinc-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                {t("Translated Docs", "Documentos traducidos")}
              </h2>
              {translatedDocs.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {translatedDocs.map(renderCard)}
                </div>
              ) : (
                <div className="rounded-[1.75rem] border border-zinc-800/60 bg-zinc-950/60 px-6 py-8 text-sm text-zinc-500">
                  {t(
                    "No completed translations yet.",
                    "Todavia no hay traducciones completadas.",
                  )}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
