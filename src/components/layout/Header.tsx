import React from "react";
import Link from "next/link";

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
        
        {/* Right Side: Page Specific Content (Login Button) */}
        <div className="flex items-center gap-4">
          {rightContent}
        </div>
        
      </div>
    </nav>
  );
}