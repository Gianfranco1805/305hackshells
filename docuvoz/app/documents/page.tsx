"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

import type { PrivateDocumentListItem } from "@/types";
import { useLanguage } from "@/lib/contexts/LanguageContext";

export default function DocumentsPage() {
  const { t } = useLanguage();
  const [recentDocs, setRecentDocs] = useState<PrivateDocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDocuments() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/documents");
        const payload = (await response.json()) as
          | { data?: PrivateDocumentListItem[]; error?: string }
          | null;

        if (!response.ok) {
          throw new Error(payload?.error || "Unable to load documents.");
        }

        if (!cancelled) {
          setRecentDocs(payload?.data ?? []);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load documents.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDocuments();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center bg-black px-6 py-12 text-white">
      <div className="w-full max-w-4xl">
        <div className="mb-10 flex items-end justify-between border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-zinc-100">
              {t("My Documents", "Mis Documentos")}
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              {t(
                "View and manage all your files.",
                "Ver y administrar todos tus archivos.",
              )}
            </p>
          </div>
          <Link
            href="/upload"
            className="mb-1 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-white"
          >
            {t("+ New", "+ Nuevo")}
          </Link>
        </div>

        <div className="mb-12">
          <h2 className="mb-6 text-xl font-semibold text-zinc-200">
            {t(
              "Recently Received Documents",
              "Documentos Recibidos Recientemente",
            )}
          </h2>

          {loading ? (
            <div className="w-full rounded-2xl border border-zinc-800/50 bg-zinc-950/50 p-8 text-center">
              <p className="text-sm text-zinc-500">
                {t("Loading documents...", "Cargando documentos...")}
              </p>
            </div>
          ) : null}

          {error ? (
            <div className="w-full rounded-2xl border border-rose-900/50 bg-rose-950/20 p-8 text-center">
              <p className="text-sm text-rose-300">{error}</p>
            </div>
          ) : null}

          {!loading && !error && recentDocs.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {recentDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="group flex cursor-pointer flex-col rounded-2xl border border-zinc-800 bg-zinc-950 p-4 transition-colors hover:border-zinc-500"
                >
                  <div className="mb-4 flex h-32 w-full items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                    <svg
                      className="h-10 w-10 text-zinc-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="truncate font-medium text-zinc-300" title={doc.title}>
                    {doc.title}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    {new Date(doc.created_at).toLocaleDateString()} &bull;{" "}
                    {doc.language.toUpperCase()}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {doc.file_name} &bull; {doc.extraction_status}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {!loading && !error && recentDocs.length === 0 ? (
            <div className="w-full rounded-2xl border border-zinc-800/50 bg-zinc-950/50 p-8 text-center">
              <p className="text-sm text-zinc-600">
                {t("No recent documents.", "No hay documentos recientes.")}
              </p>
            </div>
          ) : null}
        </div>

        <div>
          <h2 className="mb-6 text-xl font-semibold text-zinc-200">
            {t("Translated Docs", "Documentos Traducidos")}
          </h2>
          <div className="flex w-full flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 p-16">
            <svg
              className="mb-4 h-12 w-12 text-zinc-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <p className="text-zinc-500">
              {t(
                "No translated documents found.",
                "No se encontraron documentos traducidos.",
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
