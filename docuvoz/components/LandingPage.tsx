"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/contexts/LanguageContext";

const DISPLAY_FONT =
  '"SF Pro Display", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif';

export default function LandingPage() {
  const { t } = useLanguage();

  const steps = [
    {
      title: t("Upload or snap", "Sube o toma foto"),
      body: t(
        "PDFs and phone photos both work. Large tap targets keep the flow simple.",
        "Funcionan PDFs y fotos del teléfono. Los botones grandes mantienen el flujo simple.",
      ),
    },
    {
      title: t("Read in Spanish", "Lee en español"),
      body: t(
        "See the original English beside a clear Spanish translation and listen out loud.",
        "Ve el inglés original junto a una traducción clara al español y escúchalo en voz alta.",
      ),
    },
    {
      title: t("Save for later", "Guárdalo"),
      body: t(
        "Return to your documents anytime from your dashboard.",
        "Vuelve a tus documentos cuando quieras desde tu panel.",
      ),
    },
  ];

  return (
    <div className="flex-1">
      {/* Hero — black section */}
      <section
        className="w-full text-center px-6"
        style={{ background: "#000000", paddingTop: "80px", paddingBottom: "80px" }}
      >
        <div className="max-w-[980px] mx-auto">
          <h1
            className="text-white font-semibold"
            style={{
              fontFamily: DISPLAY_FONT,
              fontSize: "clamp(40px, 6vw, 56px)",
              lineHeight: 1.07,
              letterSpacing: "-0.28px",
            }}
          >
            {t("Understand any document", "Entiende cualquier documento")}
          </h1>

          <p
            className="mt-4"
            style={{
              fontFamily: DISPLAY_FONT,
              fontSize: "clamp(21px, 3vw, 28px)",
              lineHeight: 1.14,
              letterSpacing: "0.196px",
              color: "rgba(255,255,255,0.7)",
            }}
          >
            {t("before you sign it.", "antes de firmarlo.")}
          </p>

          <p
            className="mt-6 mx-auto max-w-xl"
            style={{
              fontSize: "17px",
              lineHeight: 1.47,
              letterSpacing: "-0.374px",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            {t(
              "Upload a bill, lease, school form, or photo and LegalEase turns it into clear Spanish — spoken aloud and ready for follow-up questions.",
              "Sube una factura, contrato, formulario escolar o foto y LegalEase lo convierte en español claro — con voz y listo para preguntas.",
            )}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/upload"
              className="inline-flex items-center justify-center text-white transition-opacity hover:opacity-90"
              style={{
                fontSize: "17px",
                letterSpacing: "-0.374px",
                background: "#0071e3",
                padding: "8px 20px",
                borderRadius: "8px",
              }}
            >
              {t("Upload a document", "Subir documento")}
            </Link>
            <Link
              href="/documents"
              className="inline-flex items-center justify-center text-white transition-colors"
              style={{
                fontSize: "17px",
                letterSpacing: "-0.374px",
                color: "#2997ff",
                padding: "8px 20px",
                borderRadius: "980px",
                border: "1px solid rgba(41,151,255,0.4)",
              }}
              onMouseOver={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.borderColor =
                  "#2997ff")
              }
              onMouseOut={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.borderColor =
                  "rgba(41,151,255,0.4)")
              }
            >
              {t("View documents", "Ver documentos")} ›
            </Link>
          </div>
        </div>
      </section>

      {/* How it works — light gray section */}
      <section
        className="w-full px-6"
        style={{
          background: "#f5f5f7",
          paddingTop: "80px",
          paddingBottom: "80px",
        }}
      >
        <div className="max-w-[980px] mx-auto">
          <h2
            className="text-center font-semibold mb-12"
            style={{
              fontFamily: DISPLAY_FONT,
              fontSize: "40px",
              lineHeight: 1.1,
              color: "#1d1d1f",
            }}
          >
            {t("How it works", "Cómo funciona")}
          </h2>

          <div className="grid gap-5 md:grid-cols-3">
            {steps.map((item) => (
              <article
                key={item.title}
                className="rounded-xl px-6 py-7"
                style={{
                  background: "#ffffff",
                  boxShadow: "rgba(0,0,0,0.22) 3px 5px 30px 0px",
                }}
              >
                <h3
                  className="font-bold"
                  style={{
                    fontFamily: DISPLAY_FONT,
                    fontSize: "21px",
                    lineHeight: 1.19,
                    letterSpacing: "0.231px",
                    color: "#1d1d1f",
                  }}
                >
                  {item.title}
                </h3>
                <p
                  className="mt-3"
                  style={{
                    fontSize: "14px",
                    lineHeight: 1.43,
                    letterSpacing: "-0.224px",
                    color: "rgba(0,0,0,0.8)",
                  }}
                >
                  {item.body}
                </p>
              </article>
            ))}
          </div>

          {/* Secondary CTA */}
          <div className="mt-12 text-center">
            <Link
              href="/upload?mode=camera"
              style={{
                fontSize: "14px",
                letterSpacing: "-0.224px",
                color: "#0066cc",
              }}
              onMouseOver={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.textDecoration =
                  "underline")
              }
              onMouseOut={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.textDecoration =
                  "none")
              }
            >
              {t("Or take a photo with your camera", "O toma una foto con tu cámara")} ›
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
