"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Checking if the user is in the dashboard or wizard
  const isDashboard = pathname?.startsWith("/dashboard") || pathname?.startsWith("/wizard");

  return (
    <>
      {!isDashboard && (
        <Header 
          rightContent={
            <Link 
              href="/login" 
              className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold py-2.5 px-8 rounded-xl transition-all shadow-md active:scale-[0.98]"
            >
              Login
            </Link>
          }
        />
      )}
      
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {!isDashboard && <Footer />}
    </>
  );
}