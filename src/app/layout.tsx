import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OS Failure Lab - Concurrency Failure Detection & Recovery",
  description:
    "Browser-based Operating System Concurrency Failure Detection and Recovery Simulator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
