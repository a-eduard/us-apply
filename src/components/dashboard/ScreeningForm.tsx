"use client";

import React, { useState } from 'react';
import { SmartBlockWrapper } from './SmartBlockWrapper';
import { cn } from '@/lib/utils';
import { ALLOWED_NICHES, ScreeningSchema } from '@/schemas/wizard';

export default function ScreeningForm({ app, onUpdate }: any) {
  const [screeningData, setScreeningData] = useState<any>(app.screeningData || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerified, setIsVerified] = useState(app.screeningStatus === 'verified');
  const [isPending, setIsPending] = useState(app.screeningStatus === 'pending');

  const updateField = (field: string, value: any) => {
    if (isPending || isVerified) return;
    setScreeningData((prev: any) => ({ ...prev, [field]: value }));
  };
  
  const toggleArrayField = (field: string, value: string, max?: number) => {
    if (isPending || isVerified) return;
    setScreeningData((prev: any) => {
      const current = Array.isArray(prev[field]) ? prev[field] : [];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter((v: string) => v !== value) };
      }
      if (max && current.length >= max) return prev;
      return { ...prev, [field]: [...current, value] };
    });
  };

  const handleSubmit = async () => {
    try {
      ScreeningSchema.parse(screeningData);
    } catch (e: any) {
      alert("Please complete all sections before submitting.\n" + e.errors?.map((err: any) => err.message).join('\n'));
      return;
    }
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/applications/' + app.id + '/screening', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ screeningData })
      });
      setIsPending(true);
      if (onUpdate) onUpdate();
    } catch (e) {
      alert("Failed to submit screening");
    }
    setIsSubmitting(false);
  };

  const status = isVerified ? 'verified' : isPending ? 'in_review' : 'edit';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SmartBlockWrapper title="1. Sales Motion" status={status as any} onChevronClick={() => setIsPending(false)}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Primary Role</label>
              <div className="flex flex-col gap-2">
                {["Hunter (SDR/BDR)", "Closer (AE)", "Full-Cycle"]?.map(r => (
                  <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" disabled={status !== 'edit'} checked={screeningData.primaryRole === r} onChange={() => updateField('primaryRole', r)} className="text-blue-600" />
                    {r}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Sales Cycle Sweet Spot</label>
              <div className="flex flex-col gap-2">
                {["1-Call Close", "1-4 weeks", "3-6 months", "6-12+ months"]?.map(r => (
                  <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" disabled={status !== 'edit'} checked={screeningData.salesCycle === r} onChange={() => updateField('salesCycle', r)} className="text-blue-600" />
                    {r}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </SmartBlockWrapper>

        <SmartBlockWrapper title="2. Buyer Persona" status={status as any} onChevronClick={() => setIsPending(false)}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Target Audience</label>
              <div className="flex flex-wrap gap-2">
                {["B2B SMB", "B2B Enterprise", "B2C High-ticket"]?.map(r => (
                  <button key={r} disabled={status !== 'edit'} onClick={() => toggleArrayField('targetAudience', r)} className={cn("px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border", (screeningData.targetAudience || []).includes(r) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50")}>{r}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Decision Maker</label>
              <div className="flex flex-wrap gap-2">
                {["C-Level (CEO, Founders)", "Tech (CTO, IT)", "Marketing/Sales (CMO, VP)", "HR / Ops"]?.map(r => (
                  <button key={r} disabled={status !== 'edit'} onClick={() => toggleArrayField('decisionMaker', r)} className={cn("px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border", (screeningData.decisionMaker || []).includes(r) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50")}>{r}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Average Ticket Size</label>
              <select disabled={status !== 'edit'} value={screeningData.averageTicketSize || ''} onChange={e => updateField('averageTicketSize', e.target.value)} className="w-full border-slate-200 rounded-lg text-sm bg-white p-2 outline-none">
                <option value="">Select ticket size...</option>
                <option value="< $1k">&lt; $1k</option>
                <option value="$1k-$5k">$1k-$5k</option>
                <option value="$5k-$20k">$5k-$20k</option>
                <option value="$20k-$100k">$20k-$100k</option>
                <option value="$100k+">$100k+</option>
              </select>
            </div>
          </div>
        </SmartBlockWrapper>

        <SmartBlockWrapper title="3. Product Complexity" status={status as any} onChevronClick={() => setIsPending(false)}>
           <div className="flex flex-col gap-3">
             {[
               { label: "Simple / Tangible", desc: "Simple SaaS, Services (No deep tech knowledge)" },
               { label: "Moderate / Workflow", desc: "CRM, HR Systems (Requires business process understanding)" },
               { label: "Highly Technical", desc: "API, CyberSec, Cloud (Requires speaking with devs)" }
             ]?.map(r => (
               <label key={r.label} className={cn("flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors", screeningData.productComplexity === r.label ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50")}>
                  <input type="radio" disabled={status !== 'edit'} checked={screeningData.productComplexity === r.label} onChange={() => updateField('productComplexity', r.label)} className="mt-1" />
                  <div>
                    <div className="text-sm font-bold text-slate-800">{r.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{r.desc}</div>
                  </div>
               </label>
             ))}
           </div>
        </SmartBlockWrapper>

        <SmartBlockWrapper title="4. Industry Expertise (Max 5)" status={status as any} onChevronClick={() => setIsPending(false)}>
           <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto pr-2 pb-2">
             {ALLOWED_NICHES?.map(r => {
               const isSelected = (screeningData.industryNiches || []).includes(r);
               return (
                 <button key={r} disabled={status !== 'edit'} onClick={() => toggleArrayField('industryNiches', r, 5)} className={cn("px-2.5 py-1 text-xs font-medium rounded-lg transition-colors border", isSelected ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50")}>
                   {r}
                 </button>
               );
             })}
           </div>
        </SmartBlockWrapper>
      </div>

      {status === 'edit' && (
        <button onClick={handleSubmit} disabled={isSubmitting} className="bg-slate-900 hover:bg-slate-800 transition-colors text-white px-4 py-3 rounded-xl text-sm font-bold w-full mt-4 disabled:opacity-50">
          Submit Profile for Verification
        </button>
      )}
    </div>
  );
}