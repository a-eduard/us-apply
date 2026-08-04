"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Checking if the user is in the dashboard or wizard
  const isDashboard = pathname?.startsWith("/dashboard") || pathname?.startsWith("/wizard");

  return (
    <>
      {!isDashboard && <Header />}
      
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {!isDashboard && <Footer />}
    </>
  );
}