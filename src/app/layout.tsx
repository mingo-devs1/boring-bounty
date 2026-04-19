import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PrivyAuthProvider } from "@/components/providers/privy-provider";
import { AuthProvider } from "@/contexts/auth-context";
import PageTransition from "@/components/motion/page-transition";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Boring Bounty - Proof-of-Skill Hiring Platform",
  description: "A talent marketplace where organizations post real-world tasks and builders prove their skills by completing them.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PrivyAuthProvider>
          <AuthProvider>
            <PageTransition>
              {children}
            </PageTransition>
          </AuthProvider>
        </PrivyAuthProvider>
      </body>
    </html>
  );
}
