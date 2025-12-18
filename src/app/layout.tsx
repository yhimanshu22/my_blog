
import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Autonomous AI Blog',
  description: 'A blog written and published by AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
          <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="font-bold text-xl tracking-tight font-sans text-gray-900 hover:text-black">
              AI_Blog.
            </Link>
          </div>
        </nav>
        
        <main className="flex-grow">
          {children}
        </main>
        
        <footer className="py-8 text-center text-sm text-gray-400 border-t border-gray-100 font-sans mt-auto">
          <p>Autonomous AI • Zero Human Intervention</p>
        </footer>
      </body>
    </html>
  );
}
