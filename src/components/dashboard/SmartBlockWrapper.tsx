"use client";

import React from 'react';
import { cn } from '@/lib/utils';

export type BlockStatus = 'edit' | 'in_review' | 'verified';

export interface ChevronHeaderProps {
  status: BlockStatus;
  title: string;
  onChevronClick?: () => void;
}

export const SmartBlockHeader = ({ status, title, onChevronClick }: ChevronHeaderProps) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'edit': return 'text-green-600 cursor-pointer hover:opacity-80';
      case 'in_review': return 'text-slate-500 cursor-pointer hover:opacity-80';
      case 'verified': return 'text-yellow-600 cursor-not-allowed';
      default: return '';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'edit': return 'Edit >';
      case 'in_review': return 'In review >';
      case 'verified': return 'Verified ✓';
    }
  };

  return (
    <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
      <h3 className="font-semibold text-lg text-slate-800">{title}</h3>
      <div 
        className={`font-medium flex items-center text-sm transition-opacity ${getStatusStyles()}`}
        onClick={(e) => {
          if (status !== 'verified' && onChevronClick) {
             e.stopPropagation();
             onChevronClick();
          }
        }}
      >
        {getStatusText()}
      </div>
    </div>
  );
};

export function SmartBlockWrapper({
  title,
  status,
  onChevronClick,
  children
}: {
  title: string;
  status: BlockStatus;
  onChevronClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm transition-all duration-300">
       <SmartBlockHeader title={title} status={status} onChevronClick={onChevronClick} />
       <div className="relative z-10 text-slate-700">
         {children}
       </div>
    </div>
  );
}