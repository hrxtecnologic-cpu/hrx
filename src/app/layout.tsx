import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { ptBR } from "@clerk/localizations";
import { Toaster } from "@/components/ui/toaster";
import { PWAInstaller } from "@/components/PWAInstaller";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import "./mapbox-gl.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HRX - Profissionais para Eventos",
  description: "Plataforma que conecta profissionais qualificados com organizadores de eventos",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HRX",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#dc2626",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      localization={ptBR}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#ef4444',
          colorDanger: '#dc2626',
          colorSuccess: '#16a34a',
          colorWarning: '#f59e0b',
          colorTextOnPrimaryBackground: '#ffffff',
          colorBackground: '#09090b',
          colorInputBackground: '#18181b',
          colorInputText: '#ffffff',
          colorText: '#ffffff',
          colorTextSecondary: '#ffffff',
          borderRadius: '0.5rem',
          fontFamily: 'var(--font-inter)',
        },
        elements: {
          formButtonPrimary:
            'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
          avatarBox: 'border-2 border-red-500',
        },
      }}
    >
      <html lang="pt-BR" className="dark">
        <body className={`${inter.variable} antialiased bg-background text-foreground`}>
          {children}
          <Toaster />
          <PWAInstaller />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
