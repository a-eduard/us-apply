import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css"; 
import AuthProvider from "@/providers/AuthProvider";
import ClientWrapper from "@/components/layout/ClientWrapper";
import { ThemeProvider } from "@/providers/ThemeProvider";

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: "--font-jakarta" 
});

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
    <html lang="en" suppressHydrationWarning>
      <body className={`${jakarta.variable} font-sans min-h-screen flex flex-col`}>
        <ThemeProvider>
          <AuthProvider>
            <ClientWrapper>
              {children}
            </ClientWrapper>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}