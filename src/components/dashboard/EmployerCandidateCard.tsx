"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Link as LinkIcon, FileText, Globe, Briefcase, PlayCircle, StickyNote, Check, Phone, MapPin, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

// ИСПРАВЛЕНИЕ: Убрали Shortlisted, Onboarding сделали зеленым (emerald)
const STATUS_CONFIG: Record<string, { bg: string; border: string; text: string; badge: string; shadow: string }> = {
  "New": { bg: "bg-blue-50/30", border: "border-blue-300", text: "text-blue-700", badge: "bg-blue-100 text-blue-700 border-blue-200", shadow: "shadow-blue-900/5" },
  "Reviewing": { bg: "bg-amber-50/30", border: "border-amber-400", text: "text-amber-700", badge: "bg-amber-100 text-amber-800 border-amber-200", shadow: "shadow-amber-900/5" },
  "Onboarding": { bg: "bg-emerald-50/30", border: "border-emerald-400", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700 border-emerald-200", shadow: "shadow-emerald-900/5" },
  "Declined": { bg: "bg-rose-50/30", border: "border-rose-400", text: "text-rose-700", badge: "bg-rose-100 text-rose-700 border-rose-200", shadow: "shadow-rose-900/5" },
};

const AVAILABLE_STATUSES = Object.keys(STATUS_CONFIG);

export default function EmployerCandidateCard({ candidate, fetchCandidates }: any) {
  const [expanded, setExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const normalizeStatus = (status: string) => {
    if (!status || status === "Applied") return "New";
    if (status === "Screening" || status === "Interview") return "Reviewing";
    // Все старые успешные статусы сводим в Onboarding
    if (status === "Offer" || status === "Employee" || status === "Hired" || status === "Shortlisted") return "Onboarding";
    if (AVAILABLE_STATUSES.includes(status)) return status;
    return "New";
  };

  const [localStatus, setLocalStatus] = useState(normalizeStatus(candidate.status));
  const [notes, setNotes] = useState(candidate.employer_notes || "");

  useEffect(() => {
    setLocalStatus(normalizeStatus(candidate.status));
  }, [candidate.status]);

  const config = STATUS_CONFIG[localStatus] || STATUS_CONFIG["New"];

  const handleStatusChange = async (newStatus: string) => {
    setLocalStatus(newStatus); 
    try {
      await fetch(`/api/applications/${candidate.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchCandidates();
    } catch (e) {
      console.error("Failed to update status", e);
      setLocalStatus(normalizeStatus(candidate.status)); 
    }
  };

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      await fetch(`/api/applications/${candidate.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notes }) 
      });
      fetchCandidates(); 
    } catch (e) {
      console.error("Failed to save notes", e);
    } finally {
      setIsSaving(false);
    }
  };

  const candidateFullName = `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim() || "Unknown Candidate";
  const initials = candidateFullName.substring(0, 2).toUpperCase();

  const experience = candidate.years_of_experience || candidate.yearsOfExperience;
  const niche = candidate.niche || candidate.niches;
  const linkedin = candidate.linkedinUrl || candidate.linkedin_url;
  const resume = candidate.resumeUrl || candidate.resume_url;
  const video = candidate.videoPitchUrl || candidate.video_pitch_url;
  
  const phone = candidate.phone || candidate.phone_number;
  const location = candidate.city || candidate.location || candidate.city_state;
  
  let screeningData: any = null;
  if (candidate.screening_data || candidate.screeningData) {
    const raw = candidate.screening_data || candidate.screeningData;
    if (typeof raw === 'string') {
      try { screeningData = JSON.parse(raw); } catch(e) {}
    } else {
      screeningData = raw;
    }
  }

  return (
    <div className={cn(
      "border rounded-2xl transition-all duration-300",
      expanded ? `shadow-lg ${config.shadow} ${config.border} bg-white` : `bg-white hover:shadow-md border-slate-200`
    )}>
      
      {/* Header */}
      <div 
        className={cn("p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer gap-4 rounded-2xl transition-colors", 
          !expanded && `hover:${config.bg}`
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 w-full sm:w-auto">
          <div className="flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 shadow-sm border", config.badge)}>
              {initials}
            </div>
            <div>
              <div className="font-extrabold text-slate-900 mb-0.5 leading-tight">{candidateFullName}</div>
              <div className="text-sm font-medium text-slate-500">{candidate.email}</div>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4 border-l border-slate-200 pl-4 ml-2">
            {phone && (
              <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> {phone}
              </div>
            )}
            {location && (
              <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {location}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 justify-between sm:justify-end border-t sm:border-none pt-4 sm:pt-0 border-slate-100">
          <div className={cn("px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider", config.badge)}>
            {localStatus}
          </div>
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0", 
            expanded ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
          )}>
             {expanded ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>
      
      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-100"
          >
            <div className="p-6 sm:p-8 bg-slate-50/50 flex flex-col lg:flex-row gap-8">
              
              {/* ЛЕВАЯ КОЛОНКА */}
              <div className="flex-1 space-y-6">
                
                <div className="md:hidden flex flex-col gap-2 pb-4 border-b border-slate-200">
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest mb-1">Contact Details</h3>
                  {phone && <div className="flex items-center gap-2 text-sm text-slate-700 font-medium"><Phone className="w-4 h-4 text-slate-400" /> {phone}</div>}
                  {location && <div className="flex items-center gap-2 text-sm text-slate-700 font-medium"><MapPin className="w-4 h-4 text-slate-400" /> {location}</div>}
                </div>

                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2">
                  Professional Data
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(experience || niche) && (
                    <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                        <Briefcase className="w-3.5 h-3.5" /> Experience
                      </div>
                      {experience && <div className="text-sm font-bold text-slate-900">{experience}</div>}
                      {niche && <div className="text-xs font-medium text-slate-500 mt-1">Niche: {niche}</div>}
                    </div>
                  )}

                  {linkedin && (
                    <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                        <Globe className="w-3.5 h-3.5" /> LinkedIn
                      </div>
                      <a href={linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 w-fit">
                        <LinkIcon className="w-3.5 h-3.5" /> Open Profile
                      </a>
                    </div>
                  )}

                  {resume && (
                    <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                        <FileText className="w-3.5 h-3.5" /> Resume / CV
                      </div>
                      <a href={resume} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-slate-900 w-fit">
                        <FileText className="w-3.5 h-3.5" /> View Document
                      </a>
                    </div>
                  )}

                  {video && (
                    <div className="p-4 bg-white border border-rose-100 rounded-xl shadow-sm flex flex-col justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-widest mb-2">
                        <PlayCircle className="w-3.5 h-3.5" /> Video Pitch
                      </div>
                      <a href={video} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold text-rose-600 hover:text-rose-700 w-fit">
                        <PlayCircle className="w-3.5 h-3.5" /> Watch Video
                      </a>
                    </div>
                  )}
                </div>

                {screeningData && Object.keys(screeningData).length > 0 && (
                  <div className="mt-6">
                    <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4">
                      <ClipboardList className="w-4 h-4 text-slate-400" /> Screening Answers
                    </h3>
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                      {Object.entries(screeningData).map(([key, value]) => (
                        <div key={key} className="border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                          <div className="text-xs font-bold text-slate-400 uppercase mb-1">{key.replace(/_/g, ' ')}</div>
                          <div className="text-sm font-medium text-slate-900">{String(value)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
              </div>

              {/* ПРАВАЯ КОЛОНКА: CRM */}
              <div className="w-full lg:w-80 flex flex-col gap-6">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4">
                    Pipeline Stage
                  </h3>
                  <div className="flex flex-col gap-2">
                    {AVAILABLE_STATUSES.map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        className={cn(
                          "w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all border",
                          localStatus === status 
                            ? STATUS_CONFIG[status].badge
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                        )}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 flex flex-col">
                  <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4">
                    <StickyNote className="w-4 h-4 text-slate-400" /> Private Notes
                  </h3>
                  <textarea
                    placeholder="Write your thoughts about this candidate..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full flex-1 min-h-[120px] p-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none text-slate-700"
                  />
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSaving}
                    className="mt-3 w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold py-2.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving ? "Saving..." : <><Check className="w-4 h-4"/> Save Note</>}
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}