"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Pencil, Clock, BadgeCheck, ChevronRight } from 'lucide-react';

export type BlockStatus = 'edit' | 'in_review' | 'verified';

export interface ChevronHeaderProps {
  status: BlockStatus;
  title: string;
  onChevronClick?: () => void;
  isMissing?: boolean;
}

export const SmartBlockHeader = ({ status, title, onChevronClick, isMissing }: ChevronHeaderProps) => {
  const getStatusDisplay = () => {
    if (isMissing) {
      return (
        <div className="flex items-center gap-1.5 text-rose-500 font-medium text-sm group-hover:text-rose-600 transition-colors">
          <Pencil className="w-3.5 h-3.5" />
          <span>Action Required</span>
        </div>
      );
    }

    switch (status) {
      case 'edit': 
        return (
          <div className="flex items-center gap-1.5 text-slate-500 font-medium text-sm group-hover:text-slate-900 transition-colors">
            <Pencil className="w-3.5 h-3.5" />
            <span>Edit</span>
          </div>
        );
      case 'in_review': 
        return (
          <div className="flex items-center gap-1.5 text-amber-500 font-medium text-sm">
            <Clock className="w-3.5 h-3.5" />
            <span>In review</span>
          </div>
        );
      case 'verified': 
        return (
          <div className="flex items-center gap-1.5 text-emerald-500 font-medium text-sm">
            <BadgeCheck className="w-4 h-4" />
            <span>Verified</span>
          </div>
        );
      default: 
        return null;
    }
  };

  return (
    <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100/50">
      <div className="flex items-center gap-3">
        <h3 className="font-semibold text-base text-slate-900 tracking-tight">{title}</h3>
        {isMissing && (
          <span className="flex w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
        )}
      </div>
      <button 
        type="button"
        disabled={status === 'verified' && !isMissing}
        className={cn(
          "group flex items-center gap-1 transition-all outline-none",
          status !== 'verified' || isMissing ? "cursor-pointer" : "cursor-default opacity-80"
        )}
        onClick={(e) => {
          if ((status !== 'verified' || isMissing) && onChevronClick) {
             e.stopPropagation();
             onChevronClick();
          }
        }}
      >
        {getStatusDisplay()}
        {(status !== 'verified' || isMissing) && (
          <ChevronRight className={cn(
            "w-4 h-4 ml-0.5 transition-transform group-hover:translate-x-0.5",
            isMissing ? "text-rose-500" : "text-slate-400 group-hover:text-slate-900"
          )} />
        )}
      </button>
    </div>
  );
};

export function SmartBlockWrapper({
  title,
  status,
  onChevronClick,
  isMissing,
  children
}: {
  title: string;
  status: BlockStatus;
  onChevronClick?: () => void;
  isMissing?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(
      "relative bg-white border rounded-2xl p-6 shadow-sm transition-all duration-300",
      isMissing 
        ? "border-rose-200/60 shadow-rose-100/20" 
        : "border-slate-200/60 hover:shadow-md hover:border-slate-300/60"
    )}>
       <SmartBlockHeader title={title} status={status} isMissing={isMissing} onChevronClick={onChevronClick} />
       <div className="relative z-10 text-slate-700">
         {children}
       </div>
    </div>
  );
}