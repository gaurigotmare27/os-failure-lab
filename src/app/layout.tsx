import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OS Failure Lab — Concurrency Failure Detection & Recovery",
  description:
    "Interactive academic laboratory for OS concurrency failures, deadlock detection, and process synchronization simulation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased scroll-smooth">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
