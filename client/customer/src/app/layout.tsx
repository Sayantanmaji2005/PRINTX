import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PrintX — Smart Xerox & Instant Digital Print Platform',
  description:
    'Scan shop QR code, upload documents, configure print settings, pay via UPI and print automatically.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gradient-to-b from-blue-50/60 via-slate-50 to-white text-slate-900 min-h-screen flex flex-col antialiased selection:bg-brand-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
