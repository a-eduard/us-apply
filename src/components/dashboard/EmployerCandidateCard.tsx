"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const STAGES = ["Applied", "Screening", "Interview", "Offer", "Employee"];

export default function EmployerCandidateCard({ candidate, fetchCandidates }: any) {
  const [expanded, setExpanded] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  
  const currentStageIndex = STAGES.indexOf(candidate.status) === -1 ? 0 : STAGES.indexOf(candidate.status);
  const displayedStageIndex = selectedStage ? STAGES.indexOf(selectedStage) : currentStageIndex;
  const activeStage = selectedStage || candidate.status;

  const [localCandidate, setLocalCandidate] = useState(candidate);
  const [screeningData, setScreeningData] = useState<any>(null);
  
  useEffect(() => { setLocalCandidate(candidate); }, [candidate]);
  
  const handleVerifyField = async (field: string, is_verified: boolean, english_level?: string) => {
    try {
      // NextAuth automatically includes session cookies
      await fetch('/api/applications/' + candidate.id + '/verify-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, is_verified, english_level })
      });
      
      const newCand = { ...localCandidate };
      if (field === 'experience') newCand.isExperienceVerified = is_verified;
      if (field === 'linkedin') newCand.isLinkedinVerified = is_verified;
      if (field === 'resume') newCand.isResumeVerified = is_verified;
      if (field === 'video_pitch') {
         newCand.isVideoVerified = is_verified;
         if (english_level !== undefined) newCand.englishLevel = english_level;
      }
      setLocalCandidate(newCand);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (expanded && (candidate.status === 'Screening' || selectedStage === 'Screening')) {
       fetchScreeningData();
    }
  }, [expanded, candidate.status, selectedStage]);

  const fetchScreeningData = () => {
    // NextAuth automatically includes session cookies
    fetch('/api/applications/' + candidate.id + '/stages')
      .then(r => r.json())
      .then(data => {
        if (data.screening) {
          setScreeningData(data.screening);
        }
      });
  };

  const handleVerifyScreening = async (approved: boolean) => {
    try {
      let calendlyUrl = null;
      if (approved) {
        calendlyUrl = prompt("Please provide your Calendly link for the candidate (e.g. https://calendly.com/your-name/15min):");
        if (!calendlyUrl) {
          alert('Calendly link is required to move to Interview.');
          return;
        }
      }
      
      // NextAuth automatically includes session cookies
      await fetch('/api/screening/' + candidate.id + '/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved, calendlyUrl })
      });
      alert(approved ? 'Screening verified (Moved to Interview)' : 'Screening rejected');
      fetchCandidates();
      fetchScreeningData();
    } catch (e) {
      alert('Error verifying screening');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div 
        className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <div className="font-bold text-slate-900">{candidate.firstName} {candidate.lastName}</div>
          <div className="text-xs text-slate-500">{candidate.email} • Status: <span className="font-semibold text-blue-600">{candidate.status}</span></div>
        </div>
        <div className="text-slate-400">
           {expanded ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>
      
      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-100 bg-slate-50/50"
          >
            <div className="p-6">
               {/* Stepper */}
               <div className="relative max-w-2xl mx-auto mb-10">
                  <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-200 -z-10 transform -translate-y-1/2 rounded-full"></div>
                  <div
                    className="absolute left-0 top-1/2 h-0.5 -z-10 transform -translate-y-1/2 rounded-full transition-all duration-500 bg-blue-600"
                    style={{ width: `${(currentStageIndex / (STAGES.length - 1)) * 100}%` }}
                  ></div>
                  <div className="flex justify-between items-center relative z-0">
                    {STAGES.map((stage, i) => {
                       const isClickable = i <= currentStageIndex;
                       return (
                      <div key={i} className="flex flex-col items-center gap-2 w-24">
                        <button
                          disabled={!isClickable}
                          onClick={() => setSelectedStage(stage)}
                          className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 outline-none",
                            displayedStageIndex === i ? "ring-4 ring-blue-200 scale-110" : "",
                            currentStageIndex > i ? "bg-blue-600 text-white" : 
                            currentStageIndex === i ? "bg-blue-600 text-white" : 
                            "bg-white border-2 border-slate-200 text-slate-400"
                          )}
                        >
                          {currentStageIndex > i ? "✓" : i + 1}
                        </button>
                        <div className={cn("text-[10px] font-bold uppercase tracking-wide text-center transition-colors", 
                          displayedStageIndex === i ? "text-blue-800" : currentStageIndex >= i ? "text-blue-600" : "text-slate-400"
                        )}>
                          {stage}
                        </div>
                      </div>
                    )})}
                  </div>
               </div>

               {/* Stage Content */}
               <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                  {activeStage === 'Applied' && (
                    <div className="space-y-4">
                       <h3 className="font-bold text-lg mb-2 text-slate-800">Application Profile Verification</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          <div className="p-4 border border-slate-200 rounded-xl">
                            <div className="flex justify-between items-start mb-2">
                              <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">Experience</div>
                              <button 
                                onClick={() => handleVerifyField('experience', !localCandidate.isExperienceVerified)} 
                                className={cn("text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 transition-colors", localCandidate.isExperienceVerified ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}
                              >
                                {localCandidate.isExperienceVerified ? <><CheckCircle2 className="w-3 h-3"/> Verified</> : "Mark as Verified"}
                              </button>
                            </div>
                            <div className="text-sm font-medium">{localCandidate.salesType || localCandidate.yearsOfExperience} / {localCandidate.niche || 'N/A'} / {localCandidate.averageCheck || 'N/A'}</div>
                          </div>

                          <div className="p-4 border border-slate-200 rounded-xl">
                            <div className="flex justify-between items-start mb-2">
                              <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">LinkedIn</div>
                              <button 
                                onClick={() => handleVerifyField('linkedin', !localCandidate.isLinkedinVerified)} 
                                className={cn("text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 transition-colors", localCandidate.isLinkedinVerified ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}
                              >
                                {localCandidate.isLinkedinVerified ? <><CheckCircle2 className="w-3 h-3"/> Verified</> : "Mark as Verified"}
                              </button>
                            </div>
                            {localCandidate.linkedinUrl || localCandidate.linkedin_url ? <a href={localCandidate.linkedinUrl || localCandidate.linkedin_url} target="_blank" className="text-sm font-bold text-blue-600 hover:underline">Open Profile</a> : <span className="text-sm text-slate-400">Not provided</span>}
                          </div>

                          <div className="p-4 border border-slate-200 rounded-xl">
                            <div className="flex justify-between items-start mb-2">
                              <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">Resume</div>
                              <button 
                                onClick={() => handleVerifyField('resume', !localCandidate.isResumeVerified)} 
                                className={cn("text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 transition-colors", localCandidate.isResumeVerified ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}
                              >
                                {localCandidate.isResumeVerified ? <><CheckCircle2 className="w-3 h-3"/> Verified</> : "Mark as Verified"}
                              </button>
                            </div>
                            {localCandidate.resumeUrl || localCandidate.resume_url ? <a href={localCandidate.resumeUrl || localCandidate.resume_url} target="_blank" className="text-sm font-bold text-blue-600 hover:underline">View Document</a> : <span className="text-sm text-slate-400">Not provided</span>}
                          </div>

                          <div className="p-4 border border-slate-200 rounded-xl">
                            <div className="flex justify-between items-start mb-2">
                              <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">Video Pitch</div>
                              <button 
                                onClick={() => handleVerifyField('video_pitch', !localCandidate.isVideoVerified, localCandidate.englishLevel)} 
                                className={cn("text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 transition-colors", localCandidate.isVideoVerified ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}
                              >
                                {localCandidate.isVideoVerified ? <><CheckCircle2 className="w-3 h-3"/> Verified</> : "Mark as Verified"}
                              </button>
                            </div>
                            <a href={localCandidate.videoPitchUrl || localCandidate.video_pitch_url} target="_blank" className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1 mb-3"><LinkIcon className="w-4 h-4" /> Watch</a>
                            
                            <div className="mt-2 pt-3 border-t border-slate-100">
                               <label className="text-xs font-bold text-slate-500 block mb-1">Assess English Level</label>
                               <select 
                                 className="w-full border border-slate-200 rounded text-sm p-1.5 focus:border-blue-500 outline-none"
                                 value={localCandidate.englishLevel || ''}
                                 onChange={(e) => handleVerifyField('video_pitch', localCandidate.isVideoVerified, e.target.value)}
                               >
                                 <option value="" disabled>Select level...</option>
                                 <option value="Basic">Basic</option>
                                 <option value="Advanced">Advanced</option>
                                 <option value="Native">Native</option>
                               </select>
                            </div>
                          </div>

                       </div>
                       {candidate.status === 'Applied' && (
                         <div className="mt-6 pt-6 border-t border-slate-100 flex gap-4">
                            <button onClick={async () => {
                              // NextAuth automatically includes session cookies
                              await fetch('/api/applications/' + candidate.id + '/status', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: 'Screening' })
                              });
                              fetchCandidates();
                            }} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                               Initiate Screening
                            </button>
                         </div>
                       )}
                    </div>
                  )}

                  {activeStage === 'Screening' && (
                    <div>
                       <h3 className="font-bold text-lg mb-4 text-slate-800">Screening Matchmaking</h3>
                       {!candidate?.screening_data && !candidate?.screeningData ? (
                          <div className="text-sm text-slate-500">Waiting for candidate to submit screening profile...</div>
                       ) : (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 md:col-span-2">
                                  <div className="text-sm text-slate-900">
                                    Candidate has submitted screening data. Review and verify to move forward.
                                  </div>
                               </div>
                            </div>
                            
                            {candidate.status === 'Screening' && (
                               <div className="flex gap-4 pt-4 border-t">
                                  <button onClick={() => handleVerifyScreening(true)} className="flex-1 bg-green-600 hover:bg-green-700 transition-colors text-white font-bold py-3 rounded-xl shadow-lg">Verify & Match (Move to Interview)</button>
                                  <button onClick={() => handleVerifyScreening(false)} className="flex-1 bg-red-600 hover:bg-red-700 transition-colors text-white font-bold py-3 rounded-xl shadow-lg">Reject Profile</button>
                               </div>
                            )}
                          </div>
                       )}
                    </div>
                  )}
                  
                  {activeStage === 'Interview' && (
                    <div className="text-center py-8">
                       <h3 className="font-bold text-lg mb-2 text-slate-800">Interview Stage</h3>
                       <p className="text-sm text-slate-500 mb-4">Candidate has been approved for interview.</p>
                       {candidate.interviewUrl ? (
                         <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 inline-block">
                           <div className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-1">Provided Calendly Link</div>
                           <a href={candidate.interviewUrl} target="_blank" className="text-sm font-bold text-blue-600 hover:underline">{candidate.interviewUrl}</a>
                         </div>
                       ) : null}
                    </div>
                  )}
                  {activeStage === 'Offer' && (
                    <div className="text-center py-8">
                       <h3 className="font-bold text-lg mb-2 text-slate-800">Offer Stage</h3>
                    </div>
                  )}
                  {activeStage === 'Employee' && (
                    <div className="text-center py-8">
                       <h3 className="font-bold text-lg mb-2 text-slate-800">Hired</h3>
                    </div>
                  )}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}