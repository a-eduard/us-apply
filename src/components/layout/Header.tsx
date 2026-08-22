"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Loader2, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface HeaderProps {
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  isSticky?: boolean;
  className?: string;
}

export function Header({ 
  leftContent, 
  rightContent, 
  isSticky = true, 
  className = "" 
}: HeaderProps) {
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by mounting theme toggle only on client
  useEffect(() => {
    setMounted(true);
  }, []);

  const renderAuthButton = () => {
    if (status === "loading") {
      return (
        <div className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl flex items-center justify-center min-w-[80px] sm:min-w-[100px] bg-slate-100 dark:bg-slate-800 animate-pulse transition-colors">
          <Loader2 className="w-4 h-4 animate-spin text-slate-400 dark:text-slate-500" />
        </div>
      );
    }

    if (status === "authenticated" && session?.user) {
      const user = session.user as { name?: string | null; email?: string | null; image?: string | null; role?: string };
      
      const dashboardUrl = user.role === "employer" 
        ? "/dashboard/employer" 
        : "/dashboard/candidate";
        
      return (
        <Link 
          href={dashboardUrl}
          className="px-4 sm:px-6 py-2 sm:py-2.5 bg-slate-900 dark:bg-blue-600 text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-blue-700 transition-all shadow-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-500/20 dark:focus-visible:ring-blue-500/20 active:scale-[0.98] whitespace-nowrap"
        >
          Dashboard
        </Link>
      );
    }

    return (
      <Link 
        href="/login"
        className="px-4 sm:px-6 py-2 sm:py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs sm:text-sm font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-500/20 dark:focus-visible:ring-white/20 active:scale-[0.98] whitespace-nowrap"
      >
        Sign in
      </Link>
    );
  };

  return (
    <nav 
      className={cn(
        "w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300",
        isSticky ? "sticky top-0 z-50 shadow-sm" : "relative z-50",
        className
      )}
    >
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        
        {/* Left Side: Logo + Text + Page Specific Content */}
        <div className="flex items-center gap-4 sm:gap-6 md:gap-10">
          <Link 
            href="/" 
            className="flex items-center gap-2 group outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-0.5"
          >
            <img
              src="/usc_logo.png"
              alt="USclosers Logo"
              className="h-6 sm:h-7 md:h-8 group-hover:opacity-80 transition-opacity cursor-pointer shrink-0"
            />
            <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight group-hover:opacity-80 transition-opacity">
              USclosers
            </span>
          </Link>
          {leftContent}
        </div>
        
        {/* Right Side: Theme Toggle + Auth Button */}
        <div className="flex items-center gap-2 sm:gap-4">
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98]"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 sm:w-5 h-5" /> : <Moon className="w-4 h-4 sm:w-5 h-5" />}
            </button>
          )}
          
          {rightContent !== undefined ? rightContent : renderAuthButton()}
        </div>
        
      </div>
    </nav>
  );
}