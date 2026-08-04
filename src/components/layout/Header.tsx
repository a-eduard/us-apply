"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

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

  // Умная кнопка авторизации
  const renderAuthButton = () => {
    if (status === "loading") {
      return (
        <div className="px-6 py-2.5 bg-slate-50 rounded-xl flex items-center justify-center min-w-[100px]">
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        </div>
      );
    }

    if (status === "authenticated" && session?.user) {
      // ИСПРАВЛЕНИЕ: Говорим TypeScript, что тут есть поле role
      const user = session.user as { name?: string | null; email?: string | null; image?: string | null; role?: string };
      
      // Определяем маршрут в зависимости от роли
      const dashboardUrl = user.role === "employer" 
        ? "/dashboard/employer" 
        : "/dashboard/candidate";
        
      return (
        <Link 
          href={dashboardUrl}
          className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
        >
          Go to Dashboard
        </Link>
      );
    }

    return (
      <Link 
        href="/login"
        className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
      >
        Login
      </Link>
    );
  };

  return (
    <nav 
      className={`w-full bg-white px-6 py-4 border-b border-slate-200 ${
        isSticky ? "sticky top-0 z-50 shadow-sm" : "relative z-50"
      } ${className}`}
    >
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        
        {/* Left Side: Logo + Text + Page Specific Content */}
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center gap-2 group">
            <img
              src="/usc_logo.png"
              alt="USclosers Logo"
              className="h-8 group-hover:opacity-80 transition-opacity cursor-pointer shrink-0"
            />
            <span className="text-xl font-extrabold text-slate-800 tracking-tight group-hover:opacity-80 transition-opacity">
              USclosers
            </span>
          </Link>
          {leftContent}
        </div>
        
        {/* Right Side: Page Specific Content OR Dynamic Auth Button */}
        <div className="flex items-center gap-4">
          {rightContent !== undefined ? rightContent : renderAuthButton()}
        </div>
        
      </div>
    </nav>
  );
}