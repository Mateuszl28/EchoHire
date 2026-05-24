import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://echohire1-git-main-mateuszl28s-projects.vercel.app"),
  title: {
    default: "EchoHire — AI-powered recruitment",
    template: "%s · EchoHire",
  },
  description:
    "An AI-native applicant tracking system. EchoHire turns CVs into structured signal, ranks candidates against job descriptions, and runs interview prep — powered by Claude.",
  applicationName: "EchoHire",
  keywords: ["recruitment", "AI", "ATS", "Claude", "CV analysis", "candidate matching", "Next.js"],
  authors: [{ name: "EchoHire" }],
  openGraph: {
    type: "website",
    title: "EchoHire — AI-powered recruitment",
    description:
      "Turn CVs into structured signal. Match candidates to roles. Run interview prep — with Claude.",
    siteName: "EchoHire",
  },
  twitter: {
    card: "summary_large_image",
    title: "EchoHire — AI-powered recruitment",
    description: "Turn CVs into structured signal. Match candidates to roles. With Claude.",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
