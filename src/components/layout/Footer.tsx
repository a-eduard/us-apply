import React from "react";
import { ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full bg-white py-8 border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
        
        <div className="flex items-center gap-6 flex-wrap justify-center">
          <a 
            href="https://usclosers.com/en/privacy-policy" 
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-900 transition-colors"
          >
            Privacy Policy
          </a>
          <a 
            href="https://usclosers.com/en/terms-of-service" 
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-900 transition-colors"
          >
            Terms of Service
          </a>
          <a 
            href="https://usclosers.com/en/cookie-settings" 
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-900 transition-colors"
          >
            Cookie Settings
          </a>
        </div>

        <p>© 2026 USClosers Inc. All rights reserved.</p>
      </div>
    </footer>
  );
}