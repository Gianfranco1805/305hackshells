"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import type { Document } from "@/types";

const DISPLAY_FONT =
  '"SF Pro Display", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif';

type DashboardClientProps = {
  initialDocuments: Document[];
};

function getStatusStyle(status: Document["status"]): React.CSSProperties {
  if (status === "ready") {
    return {
      background: "rgba(52,199,89,0.15)",
      color: "#34c759",
      border: "1px solid rgba(52,199,89,0.3)",
    };
  }
  if (status === "error") {
    return {
      background: "rgba(255,59,48,0.12)",
      color: "#ff3b30",
      border: "1px solid rgba(255,59,48,0.3)",
    };
  }
  return {
    background: "rgba(255,159,10,0.12)",
    color: "#ff9f0a",
    border: "1px solid rgba(255,159,10,0.3)",
  };
}

export default function DashboardClient({
  initialDocuments,
}: DashboardClientProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [documents, setDocuments] = useState(initialDocuments);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);

    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Unable to delete document.");
      }

      setDocuments((current) =>
        current.filter((document) => document.id !== id),
      );
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error ? error.message : "Unable to delete document.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div
      className="flex flex-1 items-start justify-center px-6 py-16"
      style={{ background: "#000000", color: "#ffffff" }}
    >
      <div className="w-full max-w-[980px]">
        {/* Page header */}
        <div
          className="mb-10 flex flex-col gap-4 pb-6 md:flex-row md:items-end md:justify-between"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}
        >
          <div>
            <h1
              className="font-semibold"
              style={{
                fontFamily: DISPLAY_FONT,
                fontSize: "40px",
                lineHeight: 1.1,
                color: "#ffffff",
                letterSpacing: "-0.28px",
              }}
            >
              {t("My documents", "Mis documentos")}
            </h1>
            <p
              className="mt-3 max-w-2xl"
              style={{
                fontSize: "17px",
                lineHeight: 1.47,
                letterSpacing: "-0.374px",
                color: "rgba(255,255,255,0.6)",
              }}
            >
              {t(
                "Review every upload, reopen completed translations, or remove documents you no longer need.",
                "Revisa cada carga, vuelve a abrir traducciones completas o elimina documentos que ya no necesitas.",
              )}
            </p>
          </div>

          <Link
            href="/upload"
            className="inline-flex items-center justify-center text-white transition-opacity hover:opacity-90 shrink-0"
            style={{
              fontSize: "17px",
              letterSpacing: "-0.374px",
              background: "#0071e3",
              padding: "8px 20px",
              borderRadius: "8px",
            }}
          >
            {t("Upload another", "Subir otro")}
          </Link>
        </div>

        {/* Empty state */}
        {documents.length === 0 ? (
          <div
            className="rounded-xl px-8 py-14 text-center"
            style={{
              background: "#272729",
              boxShadow: "rgba(0,0,0,0.22) 3px 5px 30px 0px",
            }}
          >
            <p
              className="font-semibold"
              style={{
                fontFamily: DISPLAY_FONT,
                fontSize: "21px",
                lineHeight: 1.19,
                color: "#ffffff",
              }}
            >
              {t("No documents yet.", "Todavía no hay documentos.")}
            </p>
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
                "Upload your first PDF or photo to start building your reading history.",
                "Sube tu primer PDF o foto para empezar tu historial de lectura.",
              )}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {documents.map((document) => (
              <article
                key={document.id}
                className="rounded-xl px-6 py-5"
                style={{
                  background: "#272729",
                  boxShadow: "rgba(0,0,0,0.22) 3px 5px 30px 0px",
                }}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2
                        className="truncate font-bold"
                        style={{
                          fontFamily: DISPLAY_FONT,
                          fontSize: "21px",
                          lineHeight: 1.19,
                          letterSpacing: "0.231px",
                          color: "#ffffff",
                        }}
                      >
                        {document.file_name}
                      </h2>
                      <span
                        className="rounded-full px-3 py-1 text-xs font-semibold uppercase"
                        style={{
                          letterSpacing: "0.2em",
                          ...getStatusStyle(document.status),
                        }}
                      >
                        {document.status}
                      </span>
                    </div>

                    <p
                      className="mt-2"
                      style={{
                        fontSize: "12px",
                        lineHeight: 1.33,
                        letterSpacing: "-0.12px",
                        color: "rgba(255,255,255,0.4)",
                      }}
                    >
                      {new Date(document.created_at).toLocaleString()}
                    </p>

                    <p
                      className="mt-4 line-clamp-3 max-w-3xl"
                      style={{
                        fontSize: "14px",
                        lineHeight: 1.43,
                        letterSpacing: "-0.224px",
                        color: "rgba(255,255,255,0.6)",
                      }}
                    >
                      {document.translated_text ??
                        document.extracted_text ??
                        document.error_message ??
                        t(
                          "Document is still processing.",
                          "El documento sigue procesándose.",
                        )}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3 shrink-0">
                    <Link
                      href={`/document/${document.id}`}
                      className="inline-flex items-center justify-center text-white transition-opacity hover:opacity-80"
                      style={{
                        fontSize: "14px",
                        letterSpacing: "-0.224px",
                        color: "#2997ff",
                        padding: "7px 16px",
                        borderRadius: "980px",
                        border: "1px solid rgba(41,151,255,0.4)",
                      }}
                    >
                      {t("Open", "Abrir")}
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(document.id)}
                      disabled={deletingId === document.id}
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
                      {deletingId === document.id
                        ? t("Deleting...", "Eliminando...")
                        : t("Delete", "Eliminar")}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
