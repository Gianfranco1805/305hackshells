"use client";

import Link from "next/link";
import SpeakButton from "@/components/SpeakButton";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import type { Document } from "@/types";

type DocumentPageClientProps = {
  document: Document;
};

export default function DocumentPageClient({
  document,
}: DocumentPageClientProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-1 items-start justify-center bg-black px-6 py-12 text-white">
      <div className="w-full max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 border-b border-zinc-800 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">
              {t("Document viewer", "Visor de documento")}
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-zinc-100">
              {document.file_name}
            </h1>
            <p className="mt-3 text-sm text-zinc-500">
              {new Date(document.created_at).toLocaleString()}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900"
            >
              {t("Back to dashboard", "Volver al panel")}
            </Link>

            {document.translated_text ? (
              <SpeakButton
                text={document.translated_text}
                defaultLabel={t("Read in Spanish", "Leer en espa ol")}
                loadingLabel={t("Generating audio...", "Generando audio...")}
              />
            ) : null}
          </div>
        </div>

        {document.status === "processing" ? (
          <section className="rounded-[2rem] border border-amber-500/30 bg-amber-500/10 px-8 py-10">
            <h2 className="text-2xl font-bold text-amber-100">
              {t("Your document is still processing", "Tu documento sigue proces ndose")}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-amber-50/80">
              {t(
                "We saved the upload and are preparing the extracted text and Spanish translation.",
                "Guardamos la carga y estamos preparando el texto extra do y la traducci n al espa ol."
              )}
            </p>
          </section>
        ) : null}

        {document.status === "error" ? (
          <section className="rounded-[2rem] border border-rose-500/30 bg-rose-500/10 px-8 py-10">
            <h2 className="text-2xl font-bold text-rose-100">
              {t("We hit a processing error", "Tuvimos un error al procesar")}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-rose-50/80">
              {document.error_message ??
                t(
                  "Please try uploading the document again.",
                  "Vuelve a intentar subir el documento."
                )}
            </p>
          </section>
        ) : null}

        {document.status === "ready" ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 px-6 py-6">
              <h2 className="text-xl font-bold text-zinc-100">
                {t("Original text", "Texto original")}
              </h2>
              <div className="mt-4 whitespace-pre-wrap text-sm leading-8 text-zinc-300">
                {document.extracted_text}
              </div>
            </section>

            <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 px-6 py-6">
              <h2 className="text-xl font-bold text-zinc-100">
                {t("Spanish translation", "Traducci n al espa ol")}
              </h2>
              <div className="mt-4 whitespace-pre-wrap text-sm leading-8 text-zinc-300">
                {document.translated_text}
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
