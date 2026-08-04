"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Calendar, AlertCircle, CheckCircle2, Link as LinkIcon, FileText, X, Video, UploadCloud } from 'lucide-react';
import { z } from 'zod';
import { SmartBlockWrapper } from './SmartBlockWrapper';
import { cn } from '@/lib/utils';

const urlSchema = z.string().url("Must be a valid URL (e.g. https://linkedin.com/...)").or(z.literal(""));

export const EditExperienceSchema = z.object({
  yearsOfExperience: z.string().min(1, "Select experience level"),
  niches: z.array(z.string())
    .min(1, "Select at least one niche")
    .max(3, "Max 3 niches allowed"),
});

const NICHES = [
  "IT / SaaS", "Real Estate", "EdTech", "Finance", 
  "Healthcare", "Marketing", "Consulting", "E-commerce"
];

const safeParseNiches = (val: any): string[] => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export default function CandidateApplicationCard({ 
  app, 
  handleSimulateHire, 
  setWithdrawingApp,
  onUpdate
}: any) {
  const isRejected = app.status === "Rejected" || app.status === "Disqualified" || app.status === "Offer Declined";
  const isWithdrawn = app.status === "Withdrawn";
  const isTalentPool = app.status === "Talent Pool";
  const isInactive = isRejected || isWithdrawn || isTalentPool;

  const [linkedinUrl, setLinkedinUrl] = useState(app.linkedinUrl || '');
  const [resumeUrl, setResumeUrl] = useState(app.resumeUrl || '');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [yearsOfExperience, setYearsOfExperience] = useState(app.yearsOfExperience || '');
  const [niches, setNiches] = useState<string[]>(safeParseNiches(app.niches));
  const [videoPitchUrl, setVideoPitchUrl] = useState(app.videoPitchUrl || '');
  
  const [editMode, setEditMode] = useState<any>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [localApp, setLocalApp] = useState(app);

  useEffect(() => {
    setLocalApp(app);
    setLinkedinUrl(app.linkedinUrl || '');
    setResumeUrl(app.resumeUrl || '');
    setYearsOfExperience(app.yearsOfExperience || '');
    setNiches(safeParseNiches(app.niches));
    setVideoPitchUrl(app.videoPitchUrl || '');
  }, [app]);

  const handleSaveField = async (field: string) => {
    setValidationError('');
    setSuccessToast(false);
    
    let updatePayload: any = {};
    if (field === 'linkedin') {
      if (linkedinUrl && !urlSchema.safeParse(linkedinUrl).success) {
        setValidationError('LinkedIn URL format is invalid.');
        return;
      }
      updatePayload = { linkedinUrl };
    } else if (field === 'video') {
      if (videoPitchUrl && !urlSchema.safeParse(videoPitchUrl).success) {
        setValidationError('Video URL format is invalid.');
        return;
      }
      updatePayload = { videoPitchUrl };
    } else if (field === 'experience') {
      updatePayload = { yearsOfExperience, niches };
    }

    setIsUpdating(true);
    try {
      const res = await fetch('/api/applications/' + localApp.id + '/enrich', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });
      
      if (res.ok) {
        setSuccessToast(true);
        setLocalApp({ ...localApp, ...updatePayload });
        setEditMode({ ...editMode, [field]: false });
        if (onUpdate) onUpdate(app.id, updatePayload);
        setTimeout(() => setSuccessToast(false), 3000);
      } else {
        setValidationError('Failed to update data.');
      }
    } catch (e) {
      setValidationError('Network error. Failed to update.');
    }
    setIsUpdating(false);
  };

  const handleSaveResume = async () => {
    if (!resumeFile && !resumeUrl) {
      setValidationError("Please select a file to upload.");
      return;
    }
    setValidationError('');
    setSuccessToast(false);
    setIsUpdating(true);

    try {
      let finalUrl = resumeUrl;
      
      if (resumeFile) {
        const formData = new FormData();
        formData.append("file", resumeFile);
        formData.append("isVideo", "false");

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        const uploadData = await uploadRes.json();
        
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || 'Failed to upload to server');
        }
        finalUrl = uploadData.publicUrl;
      }

      const res = await fetch('/api/applications/' + localApp.id + '/enrich', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeUrl: finalUrl })
      });

      if (res.ok) {
        setSuccessToast(true);
        setLocalApp({ ...localApp, resumeUrl: finalUrl });
        setResumeUrl(finalUrl);
        setResumeFile(null);
        setEditMode({ ...editMode, resume: false });
        if (onUpdate) onUpdate(app.id, { resumeUrl: finalUrl });
        setTimeout(() => setSuccessToast(false), 3000);
      } else {
        setValidationError('Failed to save application data.');
      }
    } catch (error: any) {
      setValidationError(error.message || 'File upload failed.');
    }
    setIsUpdating(false);
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const companyName = app.campaign?.company_name || app.campaign?.companyName || "Unknown Company";
  const campaignTitle = app.campaign?.title || "Unknown Role";
  const logoUrl = app.campaign?.logo_url || app.campaign?.logoUrl;

  const isMissingExperience = !localApp.yearsOfExperience || safeParseNiches(localApp.niches).length === 0;
  const isMissingLinkedIn = !localApp.linkedinUrl;
  const isMissingResume = !localApp.resumeUrl;
  const isMissingVideo = !localApp.videoPitchUrl;

  const isComplete = !isMissingExperience && !isMissingLinkedIn && !isMissingResume && !isMissingVideo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-3xl overflow-hidden bg-white border border-slate-200/60 transition-all shadow-sm",
        isInactive ? "opacity-75 grayscale-[0.2]" : ""
      )}
    >
      {/* Header Section */}
      <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 justify-between items-start border-b border-slate-100">
        <div className="flex gap-5 items-start">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-slate-100 shadow-sm" />
          ) : (
            <div className="w-14 h-14 bg-zinc-50 text-zinc-800 rounded-2xl flex items-center justify-center font-bold text-xl shrink-0 border border-zinc-100 shadow-sm">
              {companyName.charAt(0)}
            </div>
          )}
          <div className="pt-1">
            <div className="flex items-center gap-2 text-slate-400 font-semibold text-[11px] uppercase tracking-wider mb-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>{companyName}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-2">
              {campaignTitle}
            </h2>
            <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 text-xs">
                <Calendar className="w-3.5 h-3.5" /> 
                Applied: {new Date(app.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full sm:w-auto items-end pt-1">
          <div className="px-5 py-3 rounded-2xl border border-slate-200/60 bg-slate-50/50 w-full sm:w-auto">
            <div className="text-[10px] text-slate-400 font-semibold mb-1 uppercase tracking-wider">Status</div>
            <div className="font-bold flex items-center justify-between gap-4 text-slate-900 text-sm">
              {app.status}
              {!isInactive && app.status !== "Employee" && (
                <button onClick={() => handleSimulateHire(app.id)} className="text-[10px] bg-white border border-slate-200 hover:border-slate-300 text-slate-500 px-2.5 py-1 rounded-md shadow-sm transition-colors">Simulate Hire</button>
              )}
            </div>
          </div>
          {!isInactive && app.status !== "Employee" && (
            <button 
              onClick={() => setWithdrawingApp(app)} 
              className="text-xs font-semibold text-slate-400 hover:text-rose-600 transition-colors bg-transparent px-2 py-1 w-full sm:w-auto text-right"
            >
              Withdraw
            </button>
          )}
        </div>
      </div>

      {isInactive ? (
        <div className="bg-slate-50/50 p-6 sm:p-8">
          <p className="text-sm text-slate-500 font-medium">
            {isWithdrawn ? "You have withdrawn your application." : "This application is currently closed."}
          </p>
        </div>
      ) : (
        <div className="p-6 sm:p-8 bg-zinc-50/30">
          <div className="space-y-6 max-w-5xl mx-auto">
            
            {/* Elegant Status Banner */}
            <div className={cn(
              "flex justify-between items-center rounded-2xl px-6 py-4 border shadow-sm",
              isComplete ? "bg-white border-emerald-100" : "bg-white border-rose-100"
            )}>
              <div>
                <h3 className="font-bold text-slate-900 tracking-tight">Application Profile</h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Employers review this information carefully.</p>
              </div>
              {isComplete ? (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200/60 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                </span>
              ) : (
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-200/60 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Action Required
                </span>
              )}
            </div>
            
            {validationError && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3 items-start text-rose-700 text-sm font-medium shadow-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{validationError}</span>
              </div>
            )}
            {successToast && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-3 items-start text-emerald-700 text-sm font-medium shadow-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Saved successfully</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* EXPERIENCE BLOCK */}
              <SmartBlockWrapper 
                title="Experience & Niches" 
                status={localApp.isExperienceVerified ? 'verified' : (editMode.experience ? 'edit' : 'in_review')}
                isMissing={isMissingExperience}
                onChevronClick={localApp.isExperienceVerified ? undefined : () => setEditMode({...editMode, experience: true})}
              >
                {editMode?.experience && !localApp.isExperienceVerified ? (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Years of Experience</label>
                      <select 
                        value={yearsOfExperience} 
                        onChange={e=>setYearsOfExperience(e.target.value)} 
                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-400 bg-white transition-all shadow-sm"
                      >
                        <option value="">Select experience...</option>
                        <option value="< 1 year">Less than 1 year</option>
                        <option value="1-3 years">1-3 years</option>
                        <option value="3-5 years">3-5 years</option>
                        <option value="5+ years">5+ years</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Niches (up to 3)</label>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {NICHES.map(n => {
                          const isSelected = niches.includes(n);
                          return (
                          <button
                            key={n}
                            type="button"
                            onClick={() => {
                              if (isSelected) setNiches(niches.filter(x => x !== n));
                              else if (niches.length < 3) setNiches([...niches, n]);
                            }}
                            className={cn(
                              "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border shadow-sm",
                              isSelected 
                                ? "bg-slate-900 text-white border-slate-900" 
                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            )}
                          >
                            {n}
                          </button>
                        )})}
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => {
                        const parseResult = EditExperienceSchema.safeParse({ yearsOfExperience, niches });
                        if (!parseResult.success) {
                          setValidationError(parseResult.error.issues[0].message); return;
                        }
                        handleSaveField('experience');
                      }} className="flex-1 bg-slate-900 text-white text-sm py-2.5 rounded-xl font-semibold hover:bg-slate-800 transition-colors shadow-sm active:scale-[0.98]">
                        {isUpdating ? "Saving..." : "Save Details"}
                      </button>
                      <button onClick={() => setEditMode({...editMode, experience: false})} className="flex-1 bg-white border border-slate-200 text-slate-700 text-sm py-2.5 rounded-xl font-semibold hover:bg-slate-50 transition-colors active:scale-[0.98]">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                      <div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Experience</div>
                        <div className={cn("text-sm font-medium", isMissingExperience && !localApp.yearsOfExperience ? "text-rose-500" : "text-slate-900")}>
                          {localApp.yearsOfExperience || 'Not selected'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Niches</div>
                        <div className="flex flex-wrap gap-2">
                          {safeParseNiches(localApp.niches).map((n: string) => (
                              <span key={n} className="px-3 py-1 text-xs font-semibold rounded-md border border-slate-200 bg-slate-50 text-slate-700">{n}</span>
                          ))}
                          {safeParseNiches(localApp.niches).length === 0 && <span className="text-sm font-medium text-rose-500">Not selected</span>}
                        </div>
                      </div>
                  </div>
                )}
              </SmartBlockWrapper>

              {/* LINKEDIN BLOCK */}
              <SmartBlockWrapper 
                title="LinkedIn Profile" 
                status={localApp.isLinkedinVerified ? 'verified' : (localApp.linkedinUrl ? (editMode.linkedin ? 'edit' : 'in_review') : 'edit')}
                isMissing={isMissingLinkedIn}
                onChevronClick={localApp.isLinkedinVerified ? undefined : () => setEditMode({...editMode, linkedin: true})}
              >
                {editMode?.linkedin || !localApp.linkedinUrl ? (
                  <div className="space-y-4">
                    <input 
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-400 transition-all shadow-sm" 
                      value={linkedinUrl} 
                      onChange={e=>setLinkedinUrl(e.target.value)} 
                      placeholder="https://linkedin.com/in/..." 
                      autoFocus={editMode.linkedin} 
                    />
                    <div className="flex gap-3">
                        <button onClick={() => handleSaveField('linkedin')} className="flex-1 bg-slate-900 text-white text-sm py-2.5 rounded-xl font-semibold hover:bg-slate-800 transition-colors shadow-sm active:scale-[0.98]">
                          {isUpdating ? "Saving..." : "Save URL"}
                        </button>
                        {localApp.linkedinUrl && <button onClick={() => setEditMode({...editMode, linkedin: false})} className="flex-1 bg-white border border-slate-200 text-slate-700 text-sm py-2.5 rounded-xl font-semibold hover:bg-slate-50 transition-colors active:scale-[0.98]">Cancel</button>}
                    </div>
                  </div>
                ) : (
                  <a href={localApp.linkedinUrl} target="_blank" className="group inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm" onClick={e => e.stopPropagation()}>
                    <LinkIcon className="w-4 h-4 text-slate-400 group-hover:text-slate-600"/> Open Profile
                  </a>
                )}
              </SmartBlockWrapper>

              {/* RESUME BLOCK */}
              <SmartBlockWrapper 
                title="Resume / CV" 
                status={localApp.isResumeVerified ? 'verified' : (localApp.resumeUrl ? (editMode.resume ? 'edit' : 'in_review') : 'edit')}
                isMissing={isMissingResume}
                onChevronClick={localApp.isResumeVerified ? undefined : () => setEditMode({...editMode, resume: true})}
              >
                {editMode?.resume || !localApp.resumeUrl ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <input 
                        type="file" 
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) setResumeFile(e.target.files[0]);
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                      />
                      <div className={cn(
                        "w-full border-2 border-dashed rounded-xl px-4 py-6 text-center transition-all flex flex-col items-center justify-center gap-2",
                        resumeFile ? "border-slate-400 bg-slate-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white"
                      )}>
                        <UploadCloud className={cn("w-6 h-6", resumeFile ? "text-slate-700" : "text-slate-400")} />
                        <span className="text-sm font-medium text-slate-600">
                          {resumeFile ? resumeFile.name : "Click or drag file to upload"}
                        </span>
                        {!resumeFile && <span className="text-xs text-slate-400">PDF, DOC up to 5MB</span>}
                      </div>
                    </div>

                    <div className="flex gap-3">
                        <button 
                          onClick={handleSaveResume} 
                          disabled={isUpdating || (!resumeFile && !localApp.resumeUrl)} 
                          className="flex-1 bg-slate-900 text-white text-sm py-2.5 rounded-xl font-semibold hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                        >
                          {isUpdating ? "Uploading..." : "Upload File"}
                        </button>
                        
                        {localApp.resumeUrl && (
                          <button 
                            onClick={() => { setEditMode({...editMode, resume: false}); setResumeFile(null); }} 
                            className="flex-1 bg-white border border-slate-200 text-slate-700 text-sm py-2.5 rounded-xl font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 active:scale-[0.98]" 
                            disabled={isUpdating}
                          >
                            Cancel
                          </button>
                        )}
                    </div>
                  </div>
                ) : (
                  <a href={localApp.resumeUrl} target="_blank" className="group inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm" onClick={e => e.stopPropagation()}>
                    <FileText className="w-4 h-4 text-slate-400 group-hover:text-slate-600"/> View Document
                  </a>
                )}
              </SmartBlockWrapper>

              {/* VIDEO PITCH BLOCK */}
              <SmartBlockWrapper 
                title="Video Pitch" 
                status={localApp.isVideoVerified ? 'verified' : (localApp.videoPitchUrl ? 'in_review' : 'edit')}
                isMissing={isMissingVideo}
                onChevronClick={localApp.isVideoVerified ? undefined : () => alert('В следующем шаге мы добавим сюда модальное окно с камерой!')}
              >
                {!localApp.videoPitchUrl ? (
                  <div className="space-y-4 pt-1">
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Stand out by recording a quick 1-2 minute video introducing yourself.
                    </p>
                    <button 
                      onClick={() => alert('В следующем шаге мы добавим сюда модальное окно с камерой!')} 
                      className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white text-sm py-3 rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-sm active:scale-[0.98]"
                    >
                      <Video className="w-4 h-4" /> Record Video
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowVideoModal(true); }} 
                    className="group inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm"
                  >
                    <Video className="w-4 h-4 text-slate-400 group-hover:text-slate-600"/> Watch Pitch
                  </button>
                )}
              </SmartBlockWrapper>

            </div>
          </div>
        </div>
      )}

      {/* Окно для просмотра (View Pitch) */}
      {mounted && createPortal(
        <AnimatePresence>
          {showVideoModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); setShowVideoModal(false); }}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-4xl relative border border-slate-200/50"
              >
                <div className="flex justify-between items-center p-5 px-6 border-b border-slate-100">
                  <h3 className="font-bold text-lg text-slate-900 tracking-tight">Video Pitch</h3>
                  <button 
                    onClick={() => setShowVideoModal(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors outline-none"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
                <div className="p-0 bg-black">
                  {localApp.videoPitchUrl ? (
                    <video 
                      src={localApp.videoPitchUrl} 
                      controls 
                      autoPlay
                      className="w-full aspect-video bg-black"
                    />
                  ) : (
                    <div className="w-full aspect-video flex items-center justify-center text-slate-400 font-medium">
                      No video available
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
}