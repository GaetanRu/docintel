import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DocIntel — AI Document Intelligence',
  description: 'Upload any business document. Claude extracts every key detail instantly.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
