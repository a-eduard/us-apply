"use client";

import React, { useState, useEffect, useRef } from 'react';
import { signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Phone, MapPin, Briefcase, 
  Globe, FileText, Video, UploadCloud, Loader2, Save, Plus, X, Camera, Mic, StopCircle, RefreshCw, PlayCircle, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { City } from 'country-state-city';

const DEFAULT_NICHES = [
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

export default function ProfileSettingsForm({ userProfile, userId, session, onSaveSuccess }: { userProfile: any, userId: number, session: any, onSaveSuccess: () => void }) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    city: '',
    state: '',
    years_of_experience: '',
    linkedin_url: '',
    video_pitch_url: '',
    avatar_url: '',
  });

  // Avatar & Resume State
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState('');

  // Niches State
  const [niches, setNiches] = useState<string[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customNicheValue, setCustomNicheValue] = useState("");
  const [nicheWarning, setNicheWarning] = useState(false);

  // City Search State
  const [locSearch, setLocSearch] = useState('');
  const [locOptions, setLocOptions] = useState<any[]>([]);
  const [showLocDropdown, setShowLocDropdown] = useState(false);
  const skipSearchRef = useRef(false);
  const locRef = useRef<HTMLDivElement>(null);

  // Advanced & Delete Settings State
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (userProfile) {
      const nameParts = session?.user?.name?.split(' ') || [];
      const fallbackFirst = (session?.user as any)?.first_name || nameParts[0] || '';
      const fallbackLast = (session?.user as any)?.last_name || nameParts.slice(1).join(' ') || '';

      setFormData({
        first_name: userProfile.first_name || fallbackFirst,
        last_name: userProfile.last_name || fallbackLast,
        phone: userProfile.phone || '',
        city: userProfile.city || '',
        state: userProfile.state || '',
        years_of_experience: userProfile.years_of_experience || '',
        linkedin_url: userProfile.linkedin_url || '',
        video_pitch_url: userProfile.video_pitch_url || '',
        avatar_url: userProfile.avatar_url || '',
      });
      setNiches(safeParseNiches(userProfile.niches));
      setResumeUrl(userProfile.resume_url || '');
      setAvatarPreview(userProfile.avatar_url || null);
      if (userProfile.city && userProfile.state) {
        setLocSearch(`${userProfile.city}, ${userProfile.state}`);
      }
    }
  }, [userProfile, session]);

  useEffect(() => {
    const handleClickOutside = (e: any) => {
      if (locRef.current && !locRef.current.contains(e.target)) setShowLocDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (skipSearchRef.current) { skipSearchRef.current = false; return; }
    if (locSearch.length >= 3) {
      const timeout = setTimeout(() => {
        const allCities = City.getCitiesOfCountry('US') || [];
        const lower = locSearch.toLowerCase();
        const matches = allCities.filter(c => c.name.toLowerCase().includes(lower)).slice(0, 50);
        setLocOptions(matches);
        setShowLocDropdown(true);
      }, 300);
      return () => clearTimeout(timeout);
    } else {
      setLocOptions([]);
      setShowLocDropdown(false);
    }
  }, [locSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const toggleNiche = (niche: string) => {
    setNicheWarning(false);
    if (niches.includes(niche)) {
      setNiches(niches.filter(n => n !== niche));
    } else {
      if (niches.length >= 3) {
        setNicheWarning(true);
        setTimeout(() => setNicheWarning(false), 3000);
        return;
      }
      setNiches([...niches, niche]);
    }
  };

  const handleAddCustomNiche = () => {
    const trimmedVal = customNicheValue.trim();
    if (!trimmedVal) { setShowCustomInput(false); return; }
    if (niches.length >= 3) {
      setNicheWarning(true);
      setTimeout(() => setNicheWarning(false), 3000);
      setShowCustomInput(false);
      setCustomNicheValue("");
      return;
    }
    if (!niches.includes(trimmedVal)) setNiches([...niches, trimmedVal]);
    setCustomNicheValue("");
    setShowCustomInput(false);
  };

  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showCurrentVideo, setShowCurrentVideo] = useState(false);
  const [recorderState, setRecorderState] = useState<'idle' | 'recording' | 'review'>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isVideoUploading, setIsVideoUploading] = useState(false);

  const startRecording = async () => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(newStream);
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = newStream;
        videoPreviewRef.current.muted = true;
      }
      
      let mimeType = 'video/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/mp4';
      
      const recorder = new MediaRecorder(newStream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null;
          videoPreviewRef.current.src = URL.createObjectURL(blob);
          videoPreviewRef.current.controls = true;
          videoPreviewRef.current.muted = false;
        }
      };
      
      recorder.start();
      setRecorderState('recording');
    } catch (err: any) {
      alert('Failed to access camera/microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recorderState === 'recording') {
      mediaRecorderRef.current.stop();
      if (stream) stream.getTracks().forEach(t => t.stop());
      setRecorderState('review');
    }
  };

  const retakeVideo = () => {
    setRecordedBlob(null);
    setRecorderState('idle');
    if (videoPreviewRef.current) {
      videoPreviewRef.current.src = '';
      videoPreviewRef.current.controls = false;
    }
    startRecording();
  };

  const closeVideoModal = () => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    setShowVideoModal(false);
    setRecorderState('idle');
    setRecordedBlob(null);
  };

  const handleUploadVideo = async () => {
    if (!recordedBlob) return;
    setIsVideoUploading(true);
    try {
      const ext = recordedBlob.type.includes('mp4') ? 'mp4' : 'webm';
      const file = new File([recordedBlob], `pitch.${ext}`, { type: recordedBlob.type });
      
      const fileData = new FormData();
      fileData.append("file", file);
      fileData.append("isVideo", "true");

      const uploadRes = await fetch('/api/upload', { method: 'POST', body: fileData });
      const uploadData = await uploadRes.json();
      
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Failed to upload video');
      
      setFormData(prev => ({ ...prev, video_pitch_url: uploadData.publicUrl }));
      closeVideoModal();
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setIsVideoUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      let finalResumeUrl = resumeUrl;
      let finalAvatarUrl = formData.avatar_url;

      if (resumeFile) {
        const fileData = new FormData();
        fileData.append("file", resumeFile);
        fileData.append("isVideo", "false");
        fileData.append("folder", "resumes"); 
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: fileData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Failed to upload resume');
        finalResumeUrl = uploadData.publicUrl;
        setResumeUrl(finalResumeUrl);
      }

      if (avatarFile) {
        const avatarData = new FormData();
        avatarData.append("file", avatarFile);
        avatarData.append("isVideo", "false");
        avatarData.append("folder", "avatars"); 
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: avatarData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Failed to upload avatar');
        finalAvatarUrl = uploadData.publicUrl;
      }

      const payload = {
        ...formData,
        avatar_url: finalAvatarUrl,
        niches,
        resume_url: finalResumeUrl
      };

      const res = await fetch(`/api/users/${userId}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to update profile');

      setSuccess('Profile successfully updated!');
      setResumeFile(null);
      setAvatarFile(null);
      onSaveSuccess(); 
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setError('');
    try {
      const res = await fetch(`/api/users/${userId}/profile`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete account');
      }

      await signOut({ callbackUrl: '/' });
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const displayNiches = Array.from(new Set([...DEFAULT_NICHES, ...niches]));
  const userInitials = `${formData.first_name?.[0] || ''}${formData.last_name?.[0] || ''}`.toUpperCase() || 'U';

  return (
    <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 text-left max-w-[1000px] mx-auto relative">
      <div className="mb-10">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Profile Settings</h2>
        <p className="text-slate-500 font-medium mt-1">Update your personal information and professional experience.</p>
      </div>

      {error && <div className="mb-6 p-4 bg-rose-50 text-rose-700 font-semibold rounded-xl text-sm border border-rose-100">{error}</div>}
      {success && <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 font-semibold rounded-xl text-sm border border-emerald-100">{success}</div>}

      <div className="space-y-10">
        
        <section>
          <div className="flex items-center gap-2 mb-5 pb-2 border-b border-slate-100">
            <User className="w-5 h-5 text-slate-400" />
            <h3 className="text-lg font-bold text-slate-900">Personal Information</h3>
          </div>
          
          <div className="flex items-center gap-6 mb-8">
            <div className="relative group cursor-pointer w-24 h-24 shrink-0">
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer" />
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg bg-slate-100" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-3xl border-4 border-white shadow-lg">
                  {userInitials}
                </div>
              )}
              <div className="absolute inset-0 bg-slate-900/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 pointer-events-none">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Profile Picture</h3>
              <p className="text-sm text-slate-500 font-medium">Click on the image to upload a new one.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">First Name</label>
              <input name="first_name" value={formData.first_name} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-slate-100 focus:border-slate-400 outline-none transition-all font-medium" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Last Name</label>
              <input name="last_name" value={formData.last_name} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-slate-100 focus:border-slate-400 outline-none transition-all font-medium" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
              <input name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-slate-100 focus:border-slate-400 outline-none transition-all font-medium" />
            </div>
            
            <div className="space-y-2" ref={locRef}>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">City, State</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="e.g. Austin, TX"
                  value={locSearch}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLocSearch(val);
                    let c = val;
                    let s = val;
                    if (val.includes(',')) {
                      const parts = val.split(',');
                      c = parts[0].trim();
                      s = parts.slice(1).join(',').trim();
                    }
                    setFormData(prev => ({ ...prev, city: c, state: s }));
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-slate-100 focus:border-slate-400 outline-none transition-all font-medium"
                />
                {showLocDropdown && locOptions.length > 0 && (
                  <ul className="absolute z-30 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-auto text-sm py-1">
                    {locOptions.map((opt, i) => (
                      <li 
                        key={i}
                        onClick={() => {
                          const display = opt.name + ', ' + opt.stateCode;
                          skipSearchRef.current = true;
                          setLocSearch(display);
                          setFormData(prev => ({ ...prev, city: opt.name, state: opt.stateCode }));
                          setShowLocDropdown(false);
                        }}
                        className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer text-slate-700 transition-colors font-medium"
                      >
                        {opt.name}, {opt.stateCode}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-5 pb-2 border-b border-slate-100">
            <Briefcase className="w-5 h-5 text-slate-400" />
            <h3 className="text-lg font-bold text-slate-900">Professional Details</h3>
          </div>
          <div className="space-y-6">
            <div className="space-y-2 max-w-md">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Years of Experience</label>
              <select name="years_of_experience" value={formData.years_of_experience} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-slate-100 focus:border-slate-400 outline-none transition-all font-medium appearance-none cursor-pointer">
                <option value="">Select experience...</option>
                <option value="< 1 year">Less than 1 year</option>
                <option value="1-3 years">1-3 years</option>
                <option value="3-5 years">3-5 years</option>
                <option value="5+ years">5+ years</option>
              </select>
            </div>
            
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Top Niches (Select up to 3)</label>
              <div className="flex flex-wrap gap-2">
                {displayNiches.map(niche => (
                  <button
                    key={niche}
                    type="button"
                    onClick={() => toggleNiche(niche)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                      niches.includes(niche) 
                        ? "bg-slate-900 text-white border-slate-900 shadow-md" 
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    {niche}
                  </button>
                ))}

                {!showCustomInput ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (niches.length >= 3) {
                        setNicheWarning(true);
                        setTimeout(() => setNicheWarning(false), 3000);
                        return;
                      }
                      setShowCustomInput(true);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm bg-white text-slate-500 border-slate-200 border-dashed hover:border-slate-400 hover:text-slate-700 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Other
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Type niche..."
                      value={customNicheValue}
                      onChange={(e) => setCustomNicheValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); handleAddCustomNiche(); } 
                        else if (e.key === 'Escape') { setShowCustomInput(false); setCustomNicheValue(""); }
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-400 outline-none text-xs bg-slate-50 w-36 font-medium"
                    />
                    <button type="button" onClick={handleAddCustomNiche} className="p-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => { setShowCustomInput(false); setCustomNicheValue(""); }} className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              {nicheWarning && <p className="text-xs text-orange-500 font-bold animate-in fade-in">You can select a maximum of 3 specializations.</p>}
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-5 pb-2 border-b border-slate-100">
            <Globe className="w-5 h-5 text-slate-400" />
            <h3 className="text-lg font-bold text-slate-900">Links & Attachments</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">LinkedIn URL</label>
              <input name="linkedin_url" value={formData.linkedin_url} onChange={handleChange} placeholder="https://linkedin.com/in/..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-slate-100 focus:border-slate-400 outline-none transition-all font-medium" />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Video Pitch</label>
              <div className="w-full border border-slate-200 rounded-xl px-4 py-2.5 flex items-center justify-between bg-slate-50 transition-colors">
                {formData.video_pitch_url ? (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      <Video className="w-4 h-4 text-rose-500" /> Video pitch recorded
                    </span>
                    <button 
                      type="button" 
                      onClick={(e) => { e.preventDefault(); setShowCurrentVideo(true); }}
                      className="text-[11px] font-bold text-blue-600 hover:underline w-fit text-left"
                    >
                      Watch Current Video
                    </button>
                  </div>
                ) : (
                  <span className="text-sm font-medium text-slate-500 flex items-center gap-2">
                    <Video className="w-4 h-4 text-slate-400" /> No video recorded
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowVideoModal(true)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm text-xs sm:text-sm shrink-0"
                >
                  <Camera className="w-4 h-4" /> {formData.video_pitch_url ? "Re-record" : "Record"}
                </button>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resume / CV (PDF, DOCX)</label>
              
              {(resumeUrl || resumeFile) ? (
                <div className="w-full border border-slate-200 rounded-xl p-4 flex items-center justify-between bg-white shadow-sm">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-slate-900 truncate">
                        {resumeFile ? resumeFile.name : "Current Resume"}
                      </span>
                      {resumeUrl && !resumeFile && (
                        <a href={resumeUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-blue-600 hover:underline w-fit">
                          Click to view document
                        </a>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setResumeFile(null); setResumeUrl(''); }}
                    className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors shrink-0"
                    title="Remove resume"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) setResumeFile(e.target.files[0]);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  />
                  <div className="w-full border-2 border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white rounded-xl px-4 py-6 text-center transition-all flex flex-col items-center justify-center gap-2">
                    <UploadCloud className="w-6 h-6 text-slate-400" />
                    <span className="text-sm font-medium text-slate-600">
                      Click or drag file to upload
                    </span>
                    <span className="text-xs font-medium text-slate-400">PDF, DOC, DOCX up to 10MB</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Скрытая секция Danger Zone (Advanced Settings) */}
        <section className="mt-12 pt-8 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-2 outline-none"
          >
            {showAdvanced ? "Hide Advanced Settings" : "Show Advanced Settings"}
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-6 bg-rose-50 border border-rose-100 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-rose-900 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Delete Account
                    </h4>
                    <p className="text-sm text-rose-700 mt-1 font-medium max-w-xl">
                      Permanently remove your account and all associated applications. This action cannot be undone.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    type="button"
                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors shadow-md shadow-rose-600/20 shrink-0"
                  >
                    Delete Account
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

      </div>

      <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end">
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-slate-900 text-white rounded-xl py-3.5 px-8 font-bold hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-slate-900/10"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {isSaving ? "Saving changes..." : "Save Profile"}
        </button>
      </div>

      {/* --- ПОКАЗ ТЕКУЩЕГО ВИДЕО --- */}
      <AnimatePresence>
        {showCurrentVideo && formData.video_pitch_url && (
          <div 
            className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
            onClick={() => setShowCurrentVideo(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()} 
            >
              <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-rose-500" /> Your Video Pitch
                </h3>
                <button 
                  onClick={() => setShowCurrentVideo(false)} 
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="bg-black w-full aspect-video flex items-center justify-center relative">
                <video
                  src={formData.video_pitch_url}
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

      {/* --- МОДАЛКА ЗАПИСИ --- */}
      {showVideoModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900">Record Video Pitch</h3>
              <button onClick={closeVideoModal} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            
            <div className="bg-black aspect-video relative flex items-center justify-center">
              <video ref={videoPreviewRef} className={cn("w-full h-full object-cover", recorderState === 'idle' && "hidden")} playsInline autoPlay />
              
              {recorderState === 'idle' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <Camera className="w-12 h-12 text-slate-400 mb-4" />
                  <button onClick={startRecording} className="bg-rose-600 hover:bg-rose-700 text-white rounded-full w-16 h-16 flex items-center justify-center transition-transform hover:scale-105 shadow-[0_0_20px_rgba(225,29,72,0.6)]">
                     <div className="w-5 h-5 bg-white rounded-full"></div>
                  </button>
                  <p className="mt-4 text-sm font-bold tracking-widest uppercase">Click to record</p>
                </div>
              )}

              {recorderState === 'recording' && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                  <button onClick={stopRecording} className="bg-white text-slate-900 hover:bg-slate-200 rounded-full w-14 h-14 flex items-center justify-center shadow-xl transition-transform hover:scale-105">
                    <StopCircle className="w-6 h-6" />
                  </button>
                </div>
              )}
            </div>

            {recorderState === 'review' && (
              <div className="p-5 bg-slate-50 border-t border-slate-100 flex gap-4">
                <button onClick={retakeVideo} className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5" /> Retake
                </button>
                <button 
                  onClick={handleUploadVideo} 
                  disabled={isVideoUploading}
                  className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-md"
                >
                  {isVideoUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {isVideoUploading ? 'Uploading...' : 'Save & Attach'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- МОДАЛКА УДАЛЕНИЯ --- */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 p-6">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4 mx-auto">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="font-bold text-xl text-slate-900 text-center mb-2">Delete Account?</h3>
            <p className="text-slate-500 text-sm text-center mb-8 font-medium">
              Are you sure you want to permanently delete your account? All your personal data and applications will be erased.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 disabled:opacity-70"
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}