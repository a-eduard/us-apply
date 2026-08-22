import React from "react";
import Link from "next/link"; // Обязательный импорт для внутренних ссылок

export function Footer() {
  return (
    <footer className="w-full bg-white dark:bg-slate-950 py-8 border-t border-slate-200 dark:border-slate-800 mt-auto transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 transition-colors duration-300">
        
        <div className="flex items-center gap-6 flex-wrap justify-center">
          <Link 
            href="/privacy-policy" 
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Privacy Policy
          </Link>
          <Link 
            href="/terms-of-service" 
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Terms of Service
          </Link>
          <Link 
            href="/cookie-settings" 
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Cookie Settings
          </Link>
        </div>

        <p>© 2026 USClosers Inc. All rights reserved.</p>
      </div>
    </footer>
  );
}