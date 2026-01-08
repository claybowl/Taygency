import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent Organizer - AI-Powered Knowledge & Task Management",
  description:
    "Your intelligent AI assistant that organizes knowledge, manages tasks, and provides insights through a beautiful knowledge graph interface.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
