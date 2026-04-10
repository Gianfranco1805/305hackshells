import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { LanguageProvider } from "@/lib/contexts/LanguageContext";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "LegalEase",
  description: "Bilingual document assistant for Spanish-speaking communities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">
        <ClerkProvider>
          <LanguageProvider>
            <Header />
            <main className="flex-1 flex flex-col">{children}</main>
          </LanguageProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
