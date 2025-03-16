import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NextAuthProvider } from '@/providers/auth';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Identity Server',
  description: 'Secure authentication and user management system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthProvider>{children}</NextAuthProvider>
      </body>
    </html>
  );
}