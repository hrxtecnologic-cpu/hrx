import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HRX - Profissionais para Eventos",
  description: "Plataforma que conecta profissionais qualificados com organizadores de eventos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={ptBR}>
      <html lang="pt-BR" className="dark">
        <body className={`${inter.variable} antialiased bg-background text-foreground`}>
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
