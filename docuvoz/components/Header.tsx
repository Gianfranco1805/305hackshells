"use client";

import React from "react";
import { useLanguage } from "../lib/contexts/LanguageContext";
import { SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";

export default function Header() {
  const { language, toggleLanguage, t } = useLanguage();
  const { isLoaded, isSignedIn } = useAuth();

  return (
    <header
      className="sticky top-0 z-50 w-full text-white"
      style={{
        background: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        height: "48px",
      }}
    >
      <div className="max-w-[980px] mx-auto px-6 h-full flex items-center justify-between relative">
        {/* Left spacer */}
        <div className="flex-1" />

        {/* Logo — centered wordmark */}
        <Link
          href="/"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
          style={{ letterSpacing: "-0.374px" }}
        >
          <span
            className="text-white font-semibold"
            style={{ fontSize: "17px" }}
          >
            LegalEase
          </span>
        </Link>

        {/* Right section */}
        <div className="flex items-center gap-4 flex-1 justify-end">
          <button
            onClick={toggleLanguage}
            className="transition-colors"
            style={{
              fontSize: "12px",
              color: "rgba(255,255,255,0.8)",
              letterSpacing: "-0.12px",
            }}
            onMouseOver={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = "#ffffff")
            }
            onMouseOut={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color =
                "rgba(255,255,255,0.8)")
            }
          >
            {language === "en" ? "EN" : "ES"}
          </button>

          {isLoaded && !isSignedIn && (
            <div className="flex items-center gap-3">
              <SignInButton mode="modal">
                <button
                  className="transition-colors"
                  style={{
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.8)",
                    letterSpacing: "-0.12px",
                  }}
                  onMouseOver={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.color =
                      "#ffffff")
                  }
                  onMouseOut={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.color =
                      "rgba(255,255,255,0.8)")
                  }
                >
                  {t("Log In", "Iniciar Sesión")}
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button
                  className="text-white transition-opacity hover:opacity-90"
                  style={{
                    fontSize: "12px",
                    background: "#0071e3",
                    padding: "5px 11px",
                    borderRadius: "980px",
                    letterSpacing: "-0.12px",
                  }}
                >
                  {t("Sign Up", "Regístrate")}
                </button>
              </SignUpButton>
            </div>
          )}

          {isLoaded && isSignedIn && <UserButton />}
        </div>
      </div>
    </header>
  );
}
