"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Settings, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CookieSettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true, // Always true
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("usclosers_cookie_consent");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreferences({
          essential: true,
          analytics: parsed.analytics || false,
          marketing: parsed.marketing || false,
        });
      } catch (e) {
        console.error("Failed to parse cookies. Clearing corrupted data.");
        // Удаляем битые данные, чтобы баннер мог появиться снова
        localStorage.removeItem("usclosers_cookie_consent");
      }
    }
  }, []);

  const handleToggle = (key: 'analytics' | 'marketing') => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    setIsSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem("usclosers_cookie_consent", JSON.stringify({
      ...preferences,
      timestamp: new Date().toISOString()
    }));
    
    // Dispatch event so banner can disappear if it's open
    window.dispatchEvent(new Event("cookie_consent_updated"));
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-12 px-4 sm:px-6 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-8">
          <ChevronLeft className="w-4 h-4" /> Back to Home
        </Link>
        
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 sm:p-12 shadow-sm border border-slate-200/60 dark:border-slate-800 transition-colors duration-300">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-6">
            <Settings className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-3xl font-extrabold mb-4 tracking-tight">Cookie Preferences</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">Manage how we use cookies and similar technologies on our platform.</p>
          
          <div className="space-y-6">
            
            {/* Essential */}
            <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-900 dark:text-white">Strictly Necessary Cookies</h3>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full">Always Active</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                These cookies are required for the platform to function securely and properly. They cannot be switched off.
              </p>
            </div>

            {/* Analytics */}
            <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-900 dark:text-white">Analytics Cookies</h3>
                <button 
                  onClick={() => handleToggle('analytics')}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    preferences.analytics ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm",
                    preferences.analytics ? "left-6" : "left-0.5"
                  )} />
                </button>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Help us understand how visitors interact with our platform by collecting and reporting information anonymously.
              </p>
            </div>

            {/* Marketing */}
            <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-900 dark:text-white">Marketing Cookies</h3>
                <button 
                  onClick={() => handleToggle('marketing')}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    preferences.marketing ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm",
                    preferences.marketing ? "left-6" : "left-0.5"
                  )} />
                </button>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Used to track visitors across websites to display relevant and engaging advertisements.
              </p>
            </div>
            
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button 
              onClick={handleSave}
              className="w-full sm:w-auto bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3.5 px-8 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-all active:scale-[0.98] shadow-md"
            >
              Save Preferences
            </button>
            
            {isSaved && (
              <span className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5" /> Saved successfully
              </span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}