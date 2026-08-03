"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Calendar, Clock, AlertCircle, CheckCircle2, Link as LinkIcon, FileText, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

import { SmartBlockWrapper } from './SmartBlockWrapper';
import ScreeningForm from './ScreeningForm';
import { CalendlyModal } from './CalendlyModal';
import { cn } from '@/lib/utils';

const urlSchema = z.string().url("Must be a valid URL (e.g. https://linkedin.com/...)").or(z.literal(""));

export const EditExperienceSchema = z.object({
  yearsOfExperience: z.string().min(1, "Please select your experience level"),
  niches: z.array(z.string())
    .min(1, "Please select at least one niche")
    .max(3, "You can select up to 3 niches"),
});

const STAGES = ["Applied", "Screening", "Interview", "Offer", "Employee"];
const NICHES = [
  "IT / SaaS", "Real Estate", "EdTech", "Finance", 
  "Healthcare", "Marketing", "Consulting", "E-commerce"
];

export default function CandidateApplicationCard({ 
  app, 
  handleSimulateHire, 
  setWithdrawingApp,
  setActiveTab,
  onUpdate
}: any) {
  const router = useRouter();
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  
  const isRejected = app.status === "Rejected" || app.status === "Disqualified" || app.status === "Offer Declined";
  const isWithdrawn = app.status === "Withdrawn";
  const isTalentPool = app.status === "Talent Pool";
  const isAttention = app.status === "Needs Revision";
  const isInactive = isRejected || isWithdrawn || isTalentPool;
  
  let mappedStatus = app.status === "Pending Candidate Decision" ? "Offer" : app.status;
  if (app.status === "Needs Revision") mappedStatus = "Screening";
  
  const currentStageIndex = STAGES.indexOf(mappedStatus) === -1 ? 0 : STAGES.indexOf(mappedStatus);
  const displayedStageIndex = selectedStage ? STAGES.indexOf(selectedStage) : currentStageIndex;

  const [linkedinUrl, setLinkedinUrl] = useState(app.linkedinUrl || '');
  const [resumeUrl, setResumeUrl] = useState(app.resumeUrl || '');
  const [yearsOfExperience, setYearsOfExperience] = useState(app.yearsOfExperience || '');
  const [niches, setNiches] = useState<string[]>(Array.isArray(app.niches) ? app.niches : (typeof app.niches === 'string' ? JSON.parse(app.niches) : []));
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
    setNiches(Array.isArray(app.niches) ? app.niches : (typeof app.niches === 'string' ? JSON.parse(app.niches) : []));
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
    } else if (field === 'resume') {
      if (resumeUrl && !urlSchema.safeParse(resumeUrl).success) {
        setValidationError('Resume URL format is invalid.');
        return;
      }
      updatePayload = { resumeUrl };
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
      const token = localStorage.getItem('token');
      const res = await fetch('/api/applications/' + localApp.id + '/enrich', {
        method: 'PATCH',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });
      
      if (res.ok) {
        setSuccessToast(true);
        setLocalApp({ ...localApp, ...updatePayload });
        setEditMode({ ...editMode, [field]: false });
        if (onUpdate) onUpdate(app.id, updatePayload);
        setTimeout(() => setSuccessToast(false), 3000);
      } else {
        setValidationError('Failed to update. Please try again.');
      }
    } catch (e) {
      setValidationError('Network error. Failed to update.');
    }
    setIsUpdating(false);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const activeStage = selectedStage || mappedStatus;
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border",
        isInactive ? "bg-slate-50/50 border-slate-200 opacity-90" : "bg-white border-slate-200"
      )}
    >
      {/* Header Section */}
      <div className={cn("p-6 sm:p-8 flex flex-col sm:flex-row gap-6 justify-between items-start border-b", isInactive ? "border-slate-200" : "border-slate-100")}>
        <div className="flex gap-4 items-start">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 mt-1">
            {app.campaign?.companyName?.charAt(0) || "C"}
          </div>
          <div>
            <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>{app.campaign?.companyName || "Unknown Company"}</span>
            </div>
            <h2 className={cn("text-xl sm:text-2xl font-extrabold mb-2", isInactive ? "text-slate-700" : "text-slate-900")}>
              {app.campaign?.title || "Unknown Role"}
            </h2>
            <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
              <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md">
                <Calendar className="w-4 h-4" /> 
                Applied: {new Date(app.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full sm:w-auto items-end">
          <div className={cn("px-5 py-3 rounded-xl border w-full sm:w-auto", isInactive ? "bg-slate-100 border-slate-200" : "bg-slate-50 border-slate-200")}>
            <div className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-widest">Current Status</div>
            <div className={cn("font-extrabold flex items-center justify-between gap-4 text-base", isInactive ? "text-slate-600" : isAttention ? "text-amber-600" : "text-blue-600")}>
              {app.status}
              {!isInactive && app.status !== "Employee" && (
                <button onClick={() => handleSimulateHire(app.id)} className="text-[10px] bg-white border border-slate-200 hover:border-slate-300 text-slate-600 px-2 py-1 rounded-md shadow-sm transition-colors">Dev: Simulate Hire</button>
              )}
            </div>
          </div>
          {!isInactive && app.status !== "Employee" && (
            <button 
              onClick={() => setWithdrawingApp(app)} 
              className="text-xs font-bold text-slate-400 hover:text-red-600 transition-colors bg-transparent px-3 py-2 rounded-lg hover:bg-red-50 w-full sm:w-auto text-right"
            >
              Withdraw Application
            </button>
          )}
        </div>
      </div>

      {isInactive ? (
        <div className="bg-slate-50/80 p-6 sm:p-8 border-t border-white">
          <div className="max-w-2xl text-slate-500 font-medium">
            <p className="text-sm">{isWithdrawn ? "You have withdrawn your application." : "This application is closed."}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 sm:p-8">
          {/* Progress Bar */}
          <div className="relative max-w-3xl mx-auto mb-10">
            <div className="absolute left-0 right-0 top-1/2 h-1 bg-slate-100 -z-10 transform -translate-y-1/2 rounded-full"></div>
            <div
              className={cn("absolute left-0 top-1/2 h-1 -z-10 transform -translate-y-1/2 rounded-full transition-all duration-500", isAttention ? "bg-amber-500" : "bg-blue-600")}
              style={{ width: `${(currentStageIndex / (STAGES.length - 1)) * 100}%` }}
            ></div>
            <div className="flex justify-between items-center relative z-0">
              {STAGES.map((stage, i) => {
                 const isClickable = i <= currentStageIndex || (stage === "Screening" && currentStageIndex >= 0);
                 return (
                <div key={i} className="flex flex-col items-center gap-3 w-24">
                  <button
                    disabled={!isClickable}
                    onClick={() => setSelectedStage(stage)}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 outline-none",
                      displayedStageIndex === i ? "ring-4 ring-blue-100 scale-110" : "",
                      currentStageIndex > i ? "bg-blue-600 text-white border-2 border-blue-600" : 
                      currentStageIndex === i ? (isAttention ? "bg-amber-500 text-white border-2 border-amber-500" : "bg-blue-600 text-white border-2 border-blue-600") : 
                      "bg-white border-2 border-slate-200 text-slate-400"
                    )}
                  >
                    {currentStageIndex > i ? "✓" : i + 1}
                  </button>
                  <div className={cn("text-[10px] font-extrabold uppercase tracking-widest text-center transition-colors", 
                    displayedStageIndex === i ? "text-blue-900" : currentStageIndex >= i ? (isAttention ? "text-amber-600" : "text-blue-600") : "text-slate-400"
                  )}>
                    {stage}
                  </div>
                </div>
              )})}
            </div>
          </div>

          <div className="mt-8">
            {/* Stage: Applied */}
            {activeStage === "Applied" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-xl px-6 py-5 shadow-sm">
                  <h3 className="font-extrabold text-lg text-slate-900">Submitted Profile</h3>
                  {(localApp.linkedinUrl && localApp.resumeUrl) ? (
                    <span className="text-sm font-bold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200">Waiting for review</span>
                  ) : (
                    <span className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">Action Required</span>
                  )}
                </div>
                
                {validationError && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 items-start text-red-700 text-sm font-bold shadow-sm">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{validationError}</span>
                  </div>
                )}
                {successToast && (
                  <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex gap-3 items-start text-green-700 text-sm font-bold shadow-sm">
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>Profile successfully updated</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <SmartBlockWrapper 
                    title="Experience & Niches" 
                    status={localApp.isExperienceVerified ? 'verified' : (editMode.experience ? 'edit' : 'in_review')}
                    onChevronClick={localApp.isExperienceVerified ? undefined : () => setEditMode({...editMode, experience: true})}
                  >
                    {editMode?.experience && !localApp.isExperienceVerified ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 block">Years of Experience</label>
                          <select 
                            value={yearsOfExperience} 
                            onChange={e=>setYearsOfExperience(e.target.value)} 
                            className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white transition-colors"
                          >
                            <option value="">Select experience...</option>
                            <option value="< 1 year">Less than 1 year</option>
                            <option value="1-3 years">1-3 years</option>
                            <option value="3-5 years">3-5 years</option>
                            <option value="5+ years">5+ years</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 block">Niches (up to 3)</label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {NICHES.map(n => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => {
                                  if (niches.includes(n)) {
                                    setNiches(niches.filter(x => x !== n));
                                  } else {
                                    if (niches.length >= 3) return;
                                    setNiches([...niches, n]);
                                  }
                                }}
                                className={cn(
                                  "px-3 py-1.5 rounded-full text-xs font-bold transition-colors border",
                                  niches.includes(n) 
                                    ? "bg-blue-600 text-white border-blue-600" 
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                                )}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                          <button onClick={() => {
                            const parseResult = EditExperienceSchema.safeParse({ yearsOfExperience, niches });
                            if (!parseResult.success) {
                              setValidationError(parseResult.error.issues[0].message);
                              return;
                            }
                            handleSaveField('experience');
                          }} className="flex-1 bg-blue-600 text-white text-sm py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm">Save</button>
                          <button onClick={() => setEditMode({...editMode, experience: false})} className="flex-1 bg-slate-100 text-slate-700 text-sm py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                         <div className={cn("text-sm font-bold", localApp.isExperienceVerified ? "text-emerald-800" : "text-slate-800")}>
                           <span className={cn("font-medium mr-2", localApp.isExperienceVerified ? "text-emerald-600" : "text-slate-500")}>Experience:</span>
                           {localApp.yearsOfExperience || 'Not specified'}
                         </div>
                         <div>
                           <div className={cn("font-medium text-xs mb-2", localApp.isExperienceVerified ? "text-emerald-600" : "text-slate-500")}>Niches:</div>
                           <div className="flex flex-wrap gap-2">
                              {((Array.isArray(localApp.niches) ? localApp.niches : (typeof localApp.niches === 'string' ? JSON.parse(localApp.niches || '[]') : [])) as string[]).map((n: string) => (
                                 <span key={n} className={cn("px-2.5 py-1 text-xs font-bold rounded-lg border", localApp.isExperienceVerified ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-700 border-slate-200")}>{n}</span>
                              ))}
                              {(!localApp.niches || localApp.niches.length === 0) && <span className="text-sm font-medium text-slate-400">Not specified</span>}
                           </div>
                         </div>
                      </div>
                    )}
                  </SmartBlockWrapper>

                  <SmartBlockWrapper 
                    title="LinkedIn Profile" 
                    status={localApp.isLinkedinVerified ? 'verified' : (localApp.linkedinUrl ? (editMode.linkedin ? 'edit' : 'in_review') : 'edit')}
                    onChevronClick={localApp.isLinkedinVerified ? undefined : () => setEditMode({...editMode, linkedin: true})}
                  >
                    {editMode?.linkedin || !localApp.linkedinUrl ? (
                      <div className="space-y-4">
                        <input className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors" value={linkedinUrl} onChange={e=>setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/..." autoFocus={editMode.linkedin} onBlur={() => {if (linkedinUrl && linkedinUrl !== localApp.linkedinUrl) handleSaveField('linkedin')}} />
                        <div className="flex gap-3">
                           <button onClick={() => handleSaveField('linkedin')} className="flex-1 bg-blue-600 text-white text-sm py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm">Save</button>
                           {localApp.linkedinUrl && <button onClick={() => setEditMode({...editMode, linkedin: false})} className="flex-1 bg-slate-100 text-slate-700 text-sm py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancel</button>}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm font-bold"><a href={localApp.linkedinUrl} target="_blank" className={cn("hover:underline flex items-center gap-2 w-fit", localApp.isLinkedinVerified ? "text-emerald-600" : "text-blue-600")} onClick={e => e.stopPropagation()}><LinkIcon className="w-4 h-4"/> Open Profile</a></div>
                    )}
                  </SmartBlockWrapper>

                  <SmartBlockWrapper 
                    title="Resume / CV" 
                    status={localApp.isResumeVerified ? 'verified' : (localApp.resumeUrl ? (editMode.resume ? 'edit' : 'in_review') : 'edit')}
                    onChevronClick={localApp.isResumeVerified ? undefined : () => setEditMode({...editMode, resume: true})}
                  >
                    {editMode?.resume || !localApp.resumeUrl ? (
                      <div className="space-y-4">
                        <input className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors" value={resumeUrl} onChange={e=>setResumeUrl(e.target.value)} placeholder="https://drive.google.com/..." autoFocus={editMode.resume} onBlur={() => {if (resumeUrl && resumeUrl !== localApp.resumeUrl) handleSaveField('resume')}} />
                        <div className="flex gap-3">
                           <button onClick={() => handleSaveField('resume')} className="flex-1 bg-blue-600 text-white text-sm py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm">Save</button>
                           {localApp.resumeUrl && <button onClick={() => setEditMode({...editMode, resume: false})} className="flex-1 bg-slate-100 text-slate-700 text-sm py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancel</button>}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm font-bold"><a href={localApp.resumeUrl} target="_blank" className={cn("hover:underline flex items-center gap-2 w-fit", localApp.isResumeVerified ? "text-emerald-600" : "text-blue-600")} onClick={e => e.stopPropagation()}><FileText className="w-4 h-4"/> View Document</a></div>
                    )}
                  </SmartBlockWrapper>

                  <SmartBlockWrapper 
                    title="Video Pitch" 
                    status={localApp.isVideoVerified ? 'verified' : (localApp.videoPitchUrl ? (editMode.video ? 'edit' : 'in_review') : 'edit')}
                    onChevronClick={localApp.isVideoVerified ? undefined : () => setEditMode({...editMode, video: true})}
                  >
                    {editMode?.video || !localApp.videoPitchUrl ? (
                      <div className="space-y-4">
                        <input className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors" value={videoPitchUrl} onChange={e=>setVideoPitchUrl(e.target.value)} placeholder="https://..." autoFocus={editMode.video} onBlur={() => {if (videoPitchUrl && videoPitchUrl !== localApp.videoPitchUrl) handleSaveField('video')}} />
                        <div className="flex gap-3">
                           <button onClick={() => handleSaveField('video')} className="flex-1 bg-blue-600 text-white text-sm py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm">Save</button>
                           {localApp.videoPitchUrl && <button onClick={() => setEditMode({...editMode, video: false})} className="flex-1 bg-slate-100 text-slate-700 text-sm py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancel</button>}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-sm font-bold">
                          <button 
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowVideoModal(true); }} 
                            className={cn("hover:underline inline-flex items-center gap-2", localApp.isVideoVerified ? "text-emerald-600" : "text-blue-600")}
                          >
                            <LinkIcon className="w-4 h-4"/> View Pitch
                          </button>
                        </div>
                        {localApp.englishLevel && (
                          <div className={cn("inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border", localApp.isVideoVerified ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-slate-50 text-slate-700 border-slate-200")}>
                            English: <span className={cn("ml-1", localApp.isVideoVerified ? "text-emerald-600" : "text-slate-900")}>{localApp.englishLevel}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </SmartBlockWrapper>
                </div>
              </div>
            )}

            {activeStage === "Screening" && (
              <ScreeningForm app={app} onUpdate={onUpdate} />
            )}
            
            {activeStage === "Interview" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-xl px-6 py-5 shadow-sm">
                  <h3 className="font-extrabold text-lg text-slate-900">Interview Stage</h3>
                  {app.calendlyEventUri ? (
                    <span className="text-sm font-bold text-emerald-600 flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200"><Clock className="w-4 h-4"/> Scheduled</span>
                  ) : (
                    <span className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">Action Required</span>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-5">
                  <SmartBlockWrapper 
                    title="Booking Slot" 
                    status={app.calendlyEventUri ? 'in_review' : (app.interviewUrl ? 'edit' : 'in_review')}
                  >
                    {!app.interviewUrl && !app.calendlyEventUri && (
                      <div className="text-sm text-slate-500 font-medium p-2">Waiting for employer to provide calendar link...</div>
                    )}
                    {app.interviewUrl && !app.calendlyEventUri && (
                      <div className="py-2">
                        <button 
                          onClick={() => setIsModalOpen(true)}
                          className="bg-blue-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98] transition-all w-full sm:w-auto"
                        >
                          Book a Meeting
                        </button>
                        <CalendlyModal 
                          isOpen={isModalOpen} 
                          onClose={() => setIsModalOpen(false)} 
                          calendlyUrl={app.interviewUrl} 
                        />
                      </div>
                    )}
                    {app.calendlyEventUri && (
                       <div className="text-sm font-bold text-slate-700 flex items-center gap-3 p-2">
                         <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                           <Calendar className="w-4 h-4 text-emerald-600" />
                         </div>
                         <span>Meeting is scheduled. Please check your email for details.</span>
                       </div>
                    )}
                  </SmartBlockWrapper>
                </div>
              </div>
            )}
            
            {activeStage === "Offer" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-xl px-6 py-5 shadow-sm">
                  <h3 className="font-extrabold text-lg text-slate-900">Offer Stage</h3>
                  <span className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">Action Required</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <SmartBlockWrapper title="Offer Details" status="verified">
                    <div className="text-sm font-bold text-slate-700 space-y-2">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">Role: <span className="text-slate-900">Sales Representative</span></div>
                      <div className="text-slate-500 font-medium px-1">Please review the full details sent to your email.</div>
                    </div>
                  </SmartBlockWrapper>
                  <SmartBlockWrapper title="Signature / Acceptance" status="edit">
                    <div className="py-2">
                       <button className="bg-slate-900 text-white font-bold py-3 px-6 rounded-xl shadow-sm hover:bg-slate-800 transition-all active:scale-[0.98] w-full">
                         Accept & Sign
                       </button>
                    </div>
                  </SmartBlockWrapper>
                </div>
              </div>
            )}
            
            {activeStage === "Employee" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-xl px-6 py-5 shadow-sm">
                  <h3 className="font-extrabold text-lg text-slate-900">Onboarding</h3>
                  <span className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">Action Required</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <SmartBlockWrapper title="Bank Details / Crypto Wallet" status="edit">
                    <div className="space-y-3 py-1">
                      <input className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors" placeholder="Enter details..." />
                    </div>
                  </SmartBlockWrapper>
                  <SmartBlockWrapper title="NDA & Tax Forms" status="edit">
                    <div className="space-y-3 py-1">
                      <input type="file" className="text-sm text-slate-600 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer w-full transition-colors" />
                    </div>
                  </SmartBlockWrapper>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {mounted && createPortal(
        <AnimatePresence>
          {showVideoModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); setShowVideoModal(false); }}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl overflow-hidden shadow-2xl w-full max-w-4xl relative border border-slate-200/20"
              >
                <div className="flex justify-between items-center p-5 border-b border-slate-200">
                  <h3 className="font-extrabold text-lg text-slate-900">Video Pitch</h3>
                  <button 
                    onClick={() => setShowVideoModal(false)}
                    className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-slate-500" />
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