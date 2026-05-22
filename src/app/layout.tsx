import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EchoHire — AI-powered recruitment",
  description:
    "EchoHire analyzes CVs with Claude to help recruiters surface signal faster.",
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
