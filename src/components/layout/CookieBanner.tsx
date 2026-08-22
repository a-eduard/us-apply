"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  const checkConsent = () => {
    const consent = localStorage.getItem("usclosers_cookie_consent");
    
    if (!consent) {
      setShowBanner(true);
      return;
    }

    try {
      // Validate that the stored consent is actually valid JSON
      JSON.parse(consent);
      setShowBanner(false);
    } catch (error) {
      // If corrupted, remove it and show banner
      localStorage.removeItem("usclosers_cookie_consent");
      setShowBanner(true);
    }
  };

  useEffect(() => {
    checkConsent();
    window.addEventListener("cookie_consent_updated", checkConsent);
    return () => window.removeEventListener("cookie_consent_updated", checkConsent);
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem("usclosers_cookie_consent", JSON.stringify({
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString()
    }));
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    localStorage.setItem("usclosers_cookie_consent", JSON.stringify({
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString()
    }));
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.5 }}
          className="fixed bottom-0 left-0 right-0 z-[99999] p-4 sm:p-6 pointer-events-none"
        >
          <div className="max-w-5xl mx-auto bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pointer-events-auto transition-colors duration-300">
            
            <div className="flex-1 pr-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white transition-colors">We value your privacy</h3>
                <button 
                  onClick={handleRejectAll}
                  className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed transition-colors">
                We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies. 
                Read our <Link href="/privacy-policy" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</Link>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row w-full md:w-auto items-center gap-3 shrink-0">
              <Link 
                href="/cookie-settings"
                className="w-full sm:w-auto px-5 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-center transition-colors"
              >
                Preferences
              </Link>
              <button 
                onClick={handleRejectAll}
                className="w-full sm:w-auto px-5 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Reject All
              </button>
              <button 
                onClick={handleAcceptAll}
                className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20 dark:shadow-blue-900/20 transition-all active:scale-95"
              >
                Accept All
              </button>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}