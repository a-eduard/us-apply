import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; 
import AuthProvider from "@/providers/AuthProvider";
import ClientWrapper from "@/components/layout/ClientWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "USclosers - Find Your Next Sales Role",
  description: "Apply for top sales roles",
  icons: {
    icon: "/usc_logo_s.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 min-h-screen flex flex-col`}>
        <AuthProvider>
          <ClientWrapper>
            {children}
          </ClientWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}