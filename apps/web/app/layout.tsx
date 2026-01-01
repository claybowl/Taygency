import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vibe Planning - AI Task Management via Email & SMS',
  description:
    'Your AI assistant that lives in your inbox, responds to your texts, and organizes your tasks - all powered by a transparent file system you own.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
