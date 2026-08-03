"use client";

import React, { useEffect } from 'react';
import { InlineWidget } from 'react-calendly';
import { X } from 'lucide-react';

interface CalendlyModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendlyUrl: string;
}

export const CalendlyModal: React.FC<CalendlyModalProps> = ({ isOpen, onClose, calendlyUrl }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-4xl h-[80vh] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">Schedule your Interview</h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <InlineWidget 
            url={calendlyUrl} 
            styles={{ height: '100%', width: '100%' }}
          />
        </div>
      </div>
    </div>
  );
};