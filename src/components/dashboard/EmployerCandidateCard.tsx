"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Link as LinkIcon, FileText, Globe, Briefcase, PlayCircle, StickyNote, Check, Phone, MapPin, ClipboardList, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { bg: string; border: string; text: string; badge: string; shadow: string }> = {
  "New": { 
    bg: "bg-blue-50/30 dark:bg-blue-500/5", 
    border: "border-blue-300 dark:border-blue-500/30", 
    text: "text-blue-700 dark:text-blue-400", 
    badge: "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30", 
    shadow: "shadow-blue-900/5 dark:shadow-none" 
  },
  "Reviewing": { 
    bg: "bg-amber-50/30 dark:bg-amber-500/5", 
    border: "border-amber-400 dark:border-amber-500/30", 
    text: "text-amber-700 dark:text-amber-400", 
    badge: "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-500/30", 
    shadow: "shadow-amber-900/5 dark:shadow-none" 
  },
  "Onboarding": { 
    bg: "bg-emerald-50/30 dark:bg-emerald-500/5", 
    border: "border-emerald-400 dark:border-emerald-500/30", 
    text: "text-emerald-700 dark:text-emerald-400", 
    badge: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30", 
    shadow: "shadow-emerald-900/5 dark:shadow-none" 
  },
  "Declined": { 
    bg: "bg-rose-50/30 dark:bg-rose-500/5", 
    border: "border-rose-400 dark:border-rose-500/30", 
    text: "text-rose-700 dark:text-rose-400", 
    badge: "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30", 
    shadow: "shadow-rose-900/5 dark:shadow-none" 
  },
};

const AVAILABLE_STATUSES = Object.keys(STATUS_CONFIG);

export default function EmployerCandidateCard({ candidate, fetchCandidates }: any) {
  const [expanded, setExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  
  const normalizeStatus = (status: string) => {
    if (!status || status === "Applied") return "New";
    if (status === "Screening" || status === "Interview") return "Reviewing";
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
    <>
      <div className={cn(
        "border rounded-2xl transition-all duration-300 overflow-hidden w-full",
        expanded 
          ? `shadow-lg ${config.shadow} ${config.border} bg-white dark:bg-slate-900` 
          : `bg-white dark:bg-slate-900 hover:shadow-md border-slate-200 dark:border-slate-800`
      )}>
        
        {/* Header */}
        <div 
          className={cn("p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer gap-3 sm:gap-4 transition-colors w-full", 
            !expanded && `hover:${config.bg}`
          )}
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-3 sm:gap-5 w-full sm:w-auto overflow-hidden">
            <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-base sm:text-lg shrink-0 shadow-sm border", config.badge)}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-slate-900 dark:text-white mb-0.5 leading-tight truncate transition-colors">{candidateFullName}</div>
              <div className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 truncate transition-colors">{candidate.email}</div>
            </div>
            
            <div className="hidden md:flex items-center gap-4 border-l border-slate-200 dark:border-slate-800 pl-4 ml-2 shrink-0 transition-colors">
              {phone && (
                <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300 font-medium transition-colors">
                  <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {phone}
                </div>
              )}
              {location && (
                <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300 font-medium truncate max-w-[150px] transition-colors">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> <span className="truncate">{location}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-none pt-3 sm:pt-0 border-slate-100 dark:border-slate-800 shrink-0 transition-colors">
            <div className={cn("px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border text-[10px] sm:text-xs font-bold uppercase tracking-wider", config.badge)}>
              {localStatus}
            </div>
            <div className={cn("w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors shrink-0", 
              expanded 
                ? "bg-slate-900 dark:bg-blue-600 text-white" 
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
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
              className="border-t border-slate-100 dark:border-slate-800 transition-colors"
            >
              <div className="p-4 sm:p-6 lg:p-8 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col lg:flex-row gap-6 lg:gap-8 transition-colors">
                
                {/* ЛЕВАЯ КОЛОНКА */}
                <div className="flex-1 space-y-5 sm:space-y-6 min-w-0">
                  
                  <div className="md:hidden flex flex-col gap-2 pb-4 border-b border-slate-200 dark:border-slate-800 transition-colors">
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-widest mb-1 transition-colors">Contact Details</h3>
                    {phone && <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium transition-colors"><Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 dark:text-slate-500 shrink-0" /> <span className="truncate">{phone}</span></div>}
                    {location && <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium transition-colors"><MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 dark:text-slate-500 shrink-0" /> <span className="truncate">{location}</span></div>}
                  </div>

                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 pb-2 transition-colors">
                    Professional Data
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {(experience || niche) && (
                      <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden transition-colors">
                        <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 sm:mb-2 transition-colors">
                          <Briefcase className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> Experience
                        </div>
                        {experience && <div className="text-sm font-bold text-slate-900 dark:text-white truncate transition-colors">{experience}</div>}
                        {niche && <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 truncate transition-colors">Niche: {niche}</div>}
                      </div>
                    )}

                    {linkedin && (
                      <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col justify-between transition-colors">
                        <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 sm:mb-2 transition-colors">
                          <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> LinkedIn
                        </div>
                        <a href={linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 w-fit transition-colors">
                          <LinkIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Open Profile
                        </a>
                      </div>
                    )}

                    {resume && (
                      <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col justify-between transition-colors">
                        <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 sm:mb-2 transition-colors">
                          <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> Resume / CV
                        </div>
                        <a href={resume} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white w-fit transition-colors">
                          <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> View Document
                        </a>
                      </div>
                    )}

                    {video && (
                      <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-500/20 rounded-xl shadow-sm flex flex-col justify-between transition-colors">
                        <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-rose-400 dark:text-rose-500 uppercase tracking-widest mb-1.5 sm:mb-2 transition-colors">
                          <PlayCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> Video Pitch
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowVideo(true); }}
                          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 w-fit transition-colors"
                        >
                          <PlayCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Watch Video
                        </button>
                      </div>
                    )}
                  </div>

                  {screeningData && Object.keys(screeningData).length > 0 && (
                    <div className="mt-5 sm:mt-6">
                      <h3 className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 pb-2 mb-3 sm:mb-4 transition-colors">
                        <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 dark:text-slate-500 shrink-0" /> Screening Answers
                      </h3>
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-3 sm:space-y-4 transition-colors">
                        {Object.entries(screeningData).map(([key, value]) => (
                          <div key={key} className="border-b border-slate-100 dark:border-slate-800 last:border-0 pb-3 last:pb-0 transition-colors">
                            <div className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 transition-colors">{key.replace(/_/g, ' ')}</div>
                            <div className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-200 whitespace-pre-wrap transition-colors">{String(value)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                </div>

                {/* ПРАВАЯ КОЛОНКА: CRM */}
                <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-5 sm:gap-6">
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 pb-2 mb-3 sm:mb-4 transition-colors">
                      Pipeline Stage
                    </h3>
                    <div className="flex flex-col gap-2">
                      {AVAILABLE_STATUSES.map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(status)}
                          className={cn(
                            "w-full text-left px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border",
                            localStatus === status 
                              ? STATUS_CONFIG[status].badge
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
                          )}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col">
                    <h3 className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 pb-2 mb-3 sm:mb-4 transition-colors">
                      <StickyNote className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 dark:text-slate-500" /> Private Notes
                    </h3>
                    <textarea
                      placeholder="Write your thoughts about this candidate..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full flex-1 min-h-[100px] sm:min-h-[120px] p-3 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all resize-none text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 shadow-sm"
                    />
                    <button
                      onClick={handleSaveNotes}
                      disabled={isSaving}
                      className="mt-3 w-full bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white text-xs sm:text-sm font-bold py-2.5 sm:py-3 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                    >
                      {isSaving ? "Saving..." : <><Check className="w-3.5 h-3.5 sm:w-4 sm:h-4"/> Save Note</>}
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --- ВИДЕО ПЛЕЕР МОДАЛКА --- */}
      <AnimatePresence>
        {showVideo && video && (
          <div 
            className="fixed inset-0 z-[9999] bg-slate-900/80 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 transition-colors duration-300"
            onClick={() => setShowVideo(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 transition-colors"
              onClick={(e) => e.stopPropagation()} 
            >
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950 transition-colors">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2 transition-colors">
                  <PlayCircle className="w-5 h-5 text-rose-500 dark:text-rose-400" /> Video Pitch: {candidateFullName}
                </h3>
                <button 
                  onClick={() => setShowVideo(false)} 
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </button>
              </div>
              <div className="bg-black w-full aspect-video flex items-center justify-center relative">
                <video
                  src={video}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}