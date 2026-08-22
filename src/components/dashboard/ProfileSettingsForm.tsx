"use client";

import React, { useState, useEffect, useRef } from 'react';
import { signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Phone, MapPin, Briefcase, 
  Globe, FileText, Video, UploadCloud, Loader2, Save, Plus, X, Camera, StopCircle, RefreshCw, PlayCircle, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { City } from 'country-state-city';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const DEFAULT_NICHES = [
  "IT / SaaS", "Real Estate", "EdTech", "Finance", 
  "Healthcare", "Marketing", "Consulting", "E-commerce"
];

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

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

  // Crop Modal States
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

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

  // Avatar Crop Logic
  const onSelectAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); 
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '');
        setIsCropModalOpen(true);
      });
      reader.readAsDataURL(e.target.files[0]);
      e.target.value = ''; 
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  };

  const generateCroppedImage = async () => {
    if (!imgRef.current || !completedCrop) {
      setIsCropModalOpen(false);
      return;
    }

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    ctx.imageSmoothingQuality = 'high';

    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Canvas is empty');
        setIsCropModalOpen(false);
        return;
      }
      const file = new File([blob], 'avatar-cropped.jpeg', { type: 'image/jpeg' });
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setIsCropModalOpen(false);
    }, 'image/jpeg', 0.95);
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

  const labelClasses = "block text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider transition-colors mb-1.5 sm:mb-2";
  const inputClasses = "w-full px-4 py-3 sm:py-3.5 rounded-xl border outline-none bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all text-base sm:text-sm shadow-sm border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 hover:border-slate-300 dark:hover:border-slate-700";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 sm:p-6 md:p-10 shadow-sm border border-slate-200/60 dark:border-slate-800 text-left w-full relative transition-colors duration-300">
      <div className="mb-8 sm:mb-10">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors">Profile Settings</h2>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium mt-1 transition-colors">Update your personal information and professional experience.</p>
      </div>

      {error && <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 font-semibold rounded-xl text-sm border border-rose-100 dark:border-rose-500/20 shadow-sm animate-in fade-in transition-colors">{error}</div>}
      {success && <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold rounded-xl text-sm border border-emerald-100 dark:border-emerald-500/20 shadow-sm animate-in fade-in transition-colors">{success}</div>}

      <div className="space-y-10 sm:space-y-12">
        
        {/* Personal Information */}
        <section>
          <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800 transition-colors">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white transition-colors">Personal Information</h3>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-8">
            <div className="relative group cursor-pointer w-20 h-20 sm:w-24 sm:h-24 shrink-0 transition-all active:scale-[0.98]">
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onSelectAvatarFile} className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer" />
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-md bg-slate-100 dark:bg-slate-950 transition-colors" />
              ) : (
                <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center font-bold text-2xl sm:text-3xl border-4 border-white dark:border-slate-800 shadow-md transition-colors">
                  {userInitials}
                </div>
              )}
              <div className="absolute inset-0 bg-slate-900/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 pointer-events-none">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base transition-colors">Profile Picture</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5 transition-colors">Click on the image to upload a new one.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className={labelClasses}>First Name</label>
              <input name="first_name" value={formData.first_name} onChange={handleChange} className={inputClasses} />
            </div>
            <div>
              <label className={labelClasses}>Last Name</label>
              <input name="last_name" value={formData.last_name} onChange={handleChange} className={inputClasses} />
            </div>
            <div>
              <label className={labelClasses}>Phone Number</label>
              <input name="phone" value={formData.phone} onChange={handleChange} className={inputClasses} />
            </div>
            
            <div ref={locRef}>
              <label className={labelClasses}>City, State</label>
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
                  className={inputClasses}
                />
                {showLocDropdown && locOptions.length > 0 && (
                  <ul className="absolute z-30 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-auto text-sm py-1 transition-colors">
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
                        className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors font-medium"
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

        {/* Professional Details */}
        <section>
          <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800 transition-colors">
            <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white transition-colors">Professional Details</h3>
          </div>
          <div className="space-y-6">
            <div className="max-w-md">
              <label className={labelClasses}>Years of Experience</label>
              <select name="years_of_experience" value={formData.years_of_experience} onChange={handleChange} className={cn(inputClasses, "appearance-none cursor-pointer")}>
                <option value="" className="dark:bg-slate-900">Select experience...</option>
                <option value="< 1 year" className="dark:bg-slate-900">Less than 1 year</option>
                <option value="1-3 years" className="dark:bg-slate-900">1-3 years</option>
                <option value="3-5 years" className="dark:bg-slate-900">3-5 years</option>
                <option value="5+ years" className="dark:bg-slate-900">5+ years</option>
              </select>
            </div>
            
            <div>
              <label className={labelClasses}>Top Niches (Select up to 3)</label>
              <div className="flex flex-wrap gap-2 pt-1">
                {displayNiches.map(niche => (
                  <button
                    key={niche}
                    type="button"
                    onClick={() => toggleNiche(niche)}
                    className={cn(
                      "px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border shadow-sm active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                      niches.includes(niche) 
                        ? "bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 ring-2 ring-blue-600/20 dark:ring-blue-500/20" 
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800"
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
                    className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border shadow-sm bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 border-dashed hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1.5 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <Plus className="w-3.5 h-3.5" /> Other
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-200 w-full sm:w-auto mt-2 sm:mt-0">
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
                      className="px-3 py-1.5 sm:py-2 rounded-xl border border-blue-500 dark:border-blue-400 outline-none text-sm bg-blue-50/50 dark:bg-blue-950/30 text-slate-900 dark:text-slate-100 flex-1 sm:w-40 min-w-0 font-medium shadow-inner focus:ring-4 focus:ring-blue-500/20"
                    />
                    <button type="button" onClick={handleAddCustomNiche} className="p-1.5 sm:p-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-sm shrink-0 active:scale-95">
                      <Plus className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => { setShowCustomInput(false); setCustomNicheValue(""); }} className="p-1.5 sm:p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0 active:scale-95">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              {nicheWarning && <p className="text-[10px] sm:text-xs text-orange-500 dark:text-orange-400 font-bold animate-in fade-in mt-2">You can select a maximum of 3 specializations.</p>}
            </div>
          </div>
        </section>

        {/* Links & Attachments */}
        <section>
          <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800 transition-colors">
            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white transition-colors">Links & Attachments</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className={labelClasses}>LinkedIn URL</label>
              <input name="linkedin_url" value={formData.linkedin_url} onChange={handleChange} placeholder="https://linkedin.com/in/..." className={inputClasses} />
            </div>
            
            <div>
              <label className={labelClasses}>Video Pitch</label>
              <div className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50 shadow-sm transition-colors min-h-[52px]">
                {formData.video_pitch_url ? (
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors truncate">
                      <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500 dark:text-purple-400 shrink-0" /> Pitch recorded
                    </span>
                    <button 
                      type="button" 
                      onClick={(e) => { e.preventDefault(); setShowCurrentVideo(true); }}
                      className="text-[10px] sm:text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline w-fit text-left transition-colors truncate"
                    >
                      Watch Video
                    </button>
                  </div>
                ) : (
                  <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2 transition-colors">
                    <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 dark:text-slate-500 shrink-0" /> No video
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowVideoModal(true)}
                  className="px-3 sm:px-4 py-2 bg-slate-900 dark:bg-blue-600 text-white rounded-lg font-bold hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors flex items-center gap-1.5 sm:gap-2 shadow-sm text-xs sm:text-sm shrink-0 active:scale-95 outline-none focus-visible:ring-4 focus-visible:ring-slate-500/20 dark:focus-visible:ring-blue-500/40"
                >
                  <Camera className="w-3.5 h-3.5" /> {formData.video_pitch_url ? "Re-record" : "Record"}
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className={labelClasses}>Resume / CV (PDF, DOCX)</label>
              
              {(resumeUrl || resumeFile) ? (
                <div className="w-full border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 flex items-center justify-between bg-white dark:bg-slate-950/50 shadow-sm transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0 transition-colors">
                      <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate transition-colors">
                        {resumeFile ? resumeFile.name : "Current Resume"}
                      </span>
                      {resumeUrl && !resumeFile && (
                        <a href={resumeUrl} target="_blank" rel="noreferrer" className="text-[10px] sm:text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline w-fit transition-colors">
                          Click to view document
                        </a>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setResumeFile(null); setResumeUrl(''); }}
                    className="p-1.5 sm:p-2 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 rounded-lg transition-colors shrink-0 active:scale-95"
                    title="Remove resume"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              ) : (
                <div className="relative group">
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) setResumeFile(e.target.files[0]);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  />
                  <div className="w-full border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50/50 dark:hover:bg-slate-900 bg-white dark:bg-slate-950/50 rounded-xl px-4 py-6 sm:py-8 text-center transition-all flex flex-col items-center justify-center gap-2">
                    <UploadCloud className="w-6 h-6 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                    <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors">
                      Click or drag file to upload
                    </span>
                    <span className="text-[10px] sm:text-xs font-medium text-slate-400 dark:text-slate-500 transition-colors">PDF, DOC, DOCX up to 10MB</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Danger Zone (Advanced Settings) */}
        <section className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-slate-100 dark:border-slate-800 transition-colors">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs sm:text-sm font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center gap-2 outline-none rounded-md px-1"
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
                <div className="mt-4 sm:mt-6 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
                  <div>
                    <h4 className="font-bold text-rose-900 dark:text-rose-400 flex items-center gap-2 transition-colors text-sm sm:text-base">
                      <AlertTriangle className="w-4 h-4" /> Delete Account
                    </h4>
                    <p className="text-[10px] sm:text-xs text-rose-700 dark:text-rose-500 mt-1 sm:mt-1.5 font-medium max-w-xl transition-colors">
                      Permanently remove your account and all associated applications. This action cannot be undone.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    type="button"
                    className="w-full md:w-auto px-6 py-3 bg-rose-600 dark:bg-rose-500 hover:bg-rose-700 dark:hover:bg-rose-600 text-white font-bold rounded-xl transition-colors shadow-md shadow-rose-600/20 dark:shadow-rose-900/20 shrink-0 text-xs sm:text-sm active:scale-[0.98] outline-none focus-visible:ring-4 focus-visible:ring-rose-500/40"
                  >
                    Delete Account
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

      </div>

      {/* Save Button */}
      <div className="mt-8 sm:mt-10 pt-5 sm:pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end transition-colors">
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full sm:w-auto bg-blue-600 dark:bg-blue-500 text-white rounded-xl py-3.5 sm:py-4 px-8 font-bold hover:bg-blue-700 dark:hover:bg-blue-600 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 dark:shadow-blue-900/20 text-sm sm:text-base outline-none focus-visible:ring-4 focus-visible:ring-blue-500/40"
        >
          {isSaving ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Save className="w-4 h-4 sm:w-5 sm:h-5" />}
          {isSaving ? "Saving changes..." : "Save Profile"}
        </button>
      </div>

      {/* --- CROP MODAL --- */}
      <AnimatePresence>
        {isCropModalOpen && (
          <div className="fixed inset-0 z-[99999] bg-slate-900/80 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 transition-colors">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col transition-colors"
            >
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center transition-colors">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white transition-colors">Crop Profile Photo</h3>
                <button 
                  onClick={() => setIsCropModalOpen(false)} 
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-95"
                >
                  <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </button>
              </div>
              
              <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center max-h-[60vh] overflow-hidden transition-colors">
                {imgSrc && (
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={1}
                    circularCrop
                    className="max-h-[50vh] rounded-xl overflow-hidden shadow-sm"
                  >
                    <img
                      ref={imgRef}
                      alt="Crop me"
                      src={imgSrc}
                      onLoad={onImageLoad}
                      className="max-h-[50vh] w-auto object-contain"
                    />
                  </ReactCrop>
                )}
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-4 font-medium text-center">
                  Drag the edges to select the perfect square for your avatar.
                </p>
              </div>
              
              <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 transition-colors bg-white dark:bg-slate-900">
                <button 
                  type="button" 
                  onClick={() => setIsCropModalOpen(false)}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs sm:text-sm active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={generateCroppedImage}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 font-bold text-white bg-blue-600 dark:bg-blue-500 rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-xs sm:text-sm shadow-md shadow-blue-600/20 active:scale-95"
                >
                  Apply Photo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- VIDEO PITCH VIEW MODAL --- */}
      <AnimatePresence>
        {showCurrentVideo && formData.video_pitch_url && (
          <div 
            className="fixed inset-0 z-[9999] bg-slate-900/80 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 transition-colors"
            onClick={() => setShowCurrentVideo(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl border border-slate-200/60 dark:border-slate-800/60 flex flex-col transition-colors"
              onClick={(e) => e.stopPropagation()} 
            >
              <div className="p-4 sm:p-5 border-b border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center transition-colors">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2 transition-colors">
                  <PlayCircle className="w-5 h-5 text-purple-500 dark:text-purple-400" /> Your Video Pitch
                </h3>
                <button 
                  onClick={() => setShowCurrentVideo(false)} 
                  className="p-1.5 sm:p-2 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-full transition-colors active:scale-95"
                >
                  <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
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

      {/* --- RECORD VIDEO MODAL --- */}
      {showVideoModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/80 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 transition-colors">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200/60 dark:border-slate-800/60 animate-in zoom-in-95 duration-200 transition-colors">
            
            <div className="p-4 sm:p-5 border-b border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center transition-colors">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white transition-colors flex items-center gap-2">
                <Video className="w-5 h-5 text-blue-600 dark:text-blue-500" /> Record Video Pitch
              </h3>
              <button onClick={closeVideoModal} className="p-1.5 sm:p-2 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-full transition-colors active:scale-95">
                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>
            
            <div className="bg-black aspect-video relative flex items-center justify-center">
              <video ref={videoPreviewRef} className={cn("w-full h-full object-cover", recorderState === 'idle' && "hidden")} playsInline autoPlay />
              
              {recorderState === 'idle' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-slate-900/80 dark:bg-black/80 backdrop-blur-sm">
                  <Camera className="w-12 h-12 sm:w-16 sm:h-16 text-slate-400 dark:text-slate-500 mb-4 sm:mb-6 drop-shadow-md" />
                  <button onClick={startRecording} className="bg-rose-600 hover:bg-rose-500 text-white rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(225,29,72,0.5)] border-2 border-white/20 group outline-none focus-visible:ring-4 focus-visible:ring-rose-500/40">
                     <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full group-hover:scale-90 transition-transform"></div>
                  </button>
                  <p className="mt-5 sm:mt-6 text-xs sm:text-sm font-bold tracking-widest uppercase">Click to start recording</p>
                </div>
              )}

              {recorderState === 'recording' && (
                <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 animate-in slide-in-from-bottom-4">
                  <button onClick={stopRecording} className="bg-white text-slate-900 hover:bg-slate-200 rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shadow-xl transition-transform hover:scale-105 active:scale-95 outline-none focus-visible:ring-4 focus-visible:ring-white/40">
                    <StopCircle className="w-6 h-6 sm:w-7 sm:h-7 text-rose-600" />
                  </button>
                </div>
              )}
            </div>

            {recorderState === 'review' && (
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-3 sm:gap-4 transition-colors">
                <button onClick={retakeVideo} className="flex-1 py-3.5 sm:py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 active:scale-[0.98] text-sm sm:text-base outline-none focus-visible:ring-4 focus-visible:ring-slate-500/20">
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" /> Retake
                </button>
                <button 
                  onClick={handleUploadVideo} 
                  disabled={isVideoUploading}
                  className="flex-1 py-3.5 sm:py-4 bg-blue-600 dark:bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-blue-600/20 dark:shadow-blue-900/20 active:scale-[0.98] text-sm sm:text-base outline-none focus-visible:ring-4 focus-visible:ring-blue-500/40"
                >
                  {isVideoUploading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Save className="w-4 h-4 sm:w-5 sm:h-5" />}
                  {isVideoUploading ? 'Uploading...' : 'Save & Attach'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- DELETE ACCOUNT MODAL --- */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/80 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 transition-colors">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl sm:rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl border border-slate-200/60 dark:border-slate-800/60 animate-in zoom-in-95 duration-200 p-6 sm:p-8 transition-colors">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mb-5 sm:mb-6 mx-auto transition-colors shadow-inner ring-4 ring-white dark:ring-slate-900">
              <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 text-rose-500 dark:text-rose-400" />
            </div>
            <h3 className="font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-white text-center mb-2 sm:mb-3 transition-colors tracking-tight">Delete Account?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base text-center mb-6 sm:mb-8 font-medium transition-colors">
              Are you sure you want to permanently delete your account? All your personal data and applications will be erased.
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="w-full sm:flex-1 py-3 sm:py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm sm:text-base active:scale-[0.98] outline-none focus-visible:ring-4 focus-visible:ring-slate-500/20"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="w-full sm:flex-1 py-3 sm:py-3.5 bg-rose-600 dark:bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-700 dark:hover:bg-rose-600 transition-colors flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 dark:shadow-rose-900/20 disabled:opacity-70 text-sm sm:text-base active:scale-[0.98] outline-none focus-visible:ring-4 focus-visible:ring-rose-500/40"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}