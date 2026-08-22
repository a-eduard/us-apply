"use client";

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { StepThreeSchema } from '@/schemas/wizard';
import { cn } from '@/lib/utils';
import { Camera, StopCircle, RefreshCw, CheckCircle2, Loader2, Video, X } from 'lucide-react';

const StepThree = forwardRef(function StepThree({ 
  defaultValues, 
  campaignId, 
  onNext 
}: { 
  defaultValues: any, 
  campaignId: string, 
  onNext: (data: any) => void 
}, ref) {
  const { data: session } = useSession();
  
  const { handleSubmit, formState: { errors }, setValue, watch, trigger, getValues, setError } = useForm({
    resolver: zodResolver(StepThreeSchema),
    defaultValues: {
      pitchMethod: 'video',
      mediaFile: null
    }
  });

  const mediaFile = watch('mediaFile');

  useImperativeHandle(ref, () => ({
    getValues: () => getValues(),
    validateAndSubmit: async () => {
      if (!mediaFile) {
        setError('mediaFile', { type: 'manual', message: 'Please record a video pitch to submit your application.' });
        return false;
      }
      
      const isValid = await trigger();
      if (isValid) {
        return new Promise(resolve => {
          handleSubmit(async (data) => {
            await submitForm();
            resolve(true);
          })();
        });
      } else {
        return false;
      }
    }
  }));
  
  const [recorderState, setRecorderState] = useState<'idle' | 'recording' | 'review'>('idle');
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  
  const [timer, setTimer] = useState(0);
  const timerInterval = useRef<any>(null);
  const wakeLockRef = useRef<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      clearInterval(timerInterval.current);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, [stream]);

  const startRecording = async () => {
    try {
      let newStream;
      try {
        const constraints1 = { 
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, 
          audio: true 
        };
        newStream = await navigator.mediaDevices.getUserMedia(constraints1);
      } catch (err: any) {
        if (err.name === 'NotFoundError' || err.name === 'OverconstrainedError') {
          try {
            const constraints2 = { video: true, audio: true };
            newStream = await navigator.mediaDevices.getUserMedia(constraints2);
          } catch (err2: any) {
             throw new Error("Browser cannot find required devices. Check your connection.");
          }
        } else {
          throw err;
        }
      }
      
      setStream(newStream);
      
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = newStream;
        videoPreviewRef.current.muted = true;
      }
      
      let mimeType = 'video/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/mp4';
      }
      
      const recorder = new MediaRecorder(newStream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const file = new File([blob], `pitch.${ext}`, { type: mimeType });
        setValue('mediaFile', file, { shouldValidate: true });
        
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null;
          videoPreviewRef.current.src = URL.createObjectURL(blob);
          videoPreviewRef.current.controls = true;
          videoPreviewRef.current.muted = false;
        }
      };
      
      recorder.start();
      setRecorderState('recording');
      
      setTimer(0);
      timerInterval.current = setInterval(() => {
        setTimer(p => {
          if (p >= 120) {
            stopRecording();
            return p;
          }
          return p + 1;
        });
      }, 1000);
      
    } catch (err: any) {
      setMediaError('Failed to access media devices: ' + (err.message || 'Unknown error'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recorderState === 'recording') {
      mediaRecorderRef.current.stop();
      if (stream) stream.getTracks().forEach(t => t.stop());
      setRecorderState('review');
      clearInterval(timerInterval.current);
    }
  };
  
  const retake = () => {
    setValue('mediaFile', null, { shouldValidate: true });
    setRecorderState('idle');
    setMediaError(null);
    if (videoPreviewRef.current) {
      videoPreviewRef.current.src = '';
      videoPreviewRef.current.controls = false;
    }
    setTimer(0);
  };

  const submitForm = async () => {
    if (!mediaFile) {
      setError('mediaFile', { type: 'manual', message: 'Please record a video pitch to submit your application.' });
      return;
    }
    
    setIsUploading(true);
    try {
      let videoPitchUrl = null;
      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: mediaFile.name,
          fileType: mediaFile.type,
          isVideo: true
        })
      });
      const presignData = await presignRes.json();
      
      if (!presignRes.ok) throw new Error(presignData.error || 'Failed to get upload URL');

      const uploadRes = await fetch(presignData.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': mediaFile.type },
        body: mediaFile
      });
      
      if (!uploadRes.ok) throw new Error('Failed to upload to S3');
      
      videoPitchUrl = presignData.publicUrl;
      const userId = session?.user ? (session.user as any).id : null;

      if (userId) {
        await fetch(`/api/users/${userId}/profile`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ video_pitch_url: videoPitchUrl })
        });
      }

      onNext({ pitchMethod: 'video', videoPitchUrl });
    } catch (err) {
      console.error("Upload Error:", err);
      setError('mediaFile', { type: 'manual', message: 'Failed to upload video. Please try again.' });
      setIsUploading(false);
    } 
  };
  
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <form onSubmit={handleSubmit(submitForm)} className="space-y-6 sm:space-y-8 bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm sm:shadow-md border border-slate-200/60 dark:border-slate-800 max-w-[480px] sm:max-w-2xl mx-auto mt-2 sm:mt-4 relative transition-colors duration-300">

      <div className="text-center space-y-2 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-2 transition-colors">
          <Video className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-500" /> Record Your Pitch
        </h2>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 transition-colors">
          Introduce yourself and highlight your closing skills.
        </p>
      </div>

      {mediaError && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 px-4 py-3 rounded-xl text-xs sm:text-sm flex flex-col gap-2 relative animate-in fade-in transition-colors">
          <p className="font-bold pr-6">{mediaError}</p>
          <button type="button" onClick={() => setMediaError(null)} className="absolute top-2.5 right-3 text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 transition-colors">
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      )}

      {/* Video Container */}
      <div className="border-[3px] sm:border-4 border-slate-100 dark:border-slate-800 rounded-2xl sm:rounded-[2rem] bg-black aspect-video flex flex-col items-center justify-center relative overflow-hidden shadow-inner transition-colors duration-300">
        <video ref={videoPreviewRef} className={cn("w-full h-full object-cover rounded-xl sm:rounded-[1.7rem]", recorderState === 'idle' && "hidden")} playsInline autoPlay />
        
        {recorderState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 dark:bg-black/80 backdrop-blur-sm text-white p-6 text-center z-10 transition-all">
            <Camera className="w-12 h-12 sm:w-16 sm:h-16 text-slate-400 dark:text-slate-500 mb-4 sm:mb-6 drop-shadow-md" />
            <button 
              type="button" 
              onClick={startRecording} 
              className="mt-2 bg-rose-600 hover:bg-rose-500 text-white rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.5)] dark:shadow-[0_0_30px_rgba(225,29,72,0.6)] transition-all hover:scale-105 active:scale-95 group border-2 border-white/20 outline-none focus-visible:ring-4 focus-visible:ring-rose-500/40"
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white group-hover:scale-90 transition-transform"></div>
            </button>
            <p className="mt-5 sm:mt-8 text-xs sm:text-sm text-slate-200 font-bold tracking-widest uppercase">Click to start recording</p>
            <p className="mt-2 text-[10px] sm:text-xs text-slate-400 font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">Max duration: 2 minutes</p>
          </div>
        )}

        {recorderState === 'recording' && (
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 sm:gap-4 z-20 animate-in slide-in-from-bottom-4">
            <div className="bg-black/70 backdrop-blur-md text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-mono text-sm sm:text-base font-bold flex items-center gap-2.5 sm:gap-3 shadow-xl border border-white/10">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(225,29,72,0.8)]"></div>
              {formatTime(timer)}
            </div>
            <button 
              type="button" 
              onClick={stopRecording} 
              className="bg-white text-slate-900 hover:bg-slate-200 rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shadow-xl transition-all hover:scale-105 active:scale-95 outline-none focus-visible:ring-4 focus-visible:ring-white/40"
            >
              <StopCircle className="w-6 h-6 sm:w-7 sm:h-7 text-rose-600" />
            </button>
          </div>
        )}
      </div>
      
      {errors.mediaFile && (
        <p className="text-[10px] sm:text-xs font-bold text-rose-500 dark:text-rose-400 text-center bg-rose-50 dark:bg-rose-500/10 py-2.5 sm:py-3 rounded-xl border border-rose-100 dark:border-rose-500/20 animate-in zoom-in-95 transition-colors mt-2 sm:mt-0">
          {(errors.mediaFile as any).message}
        </p>
      )}

      {/* Buttons */}
      <div className="pt-2 sm:pt-4">
        {recorderState === 'idle' && (
          <button type="submit" disabled={isUploading} className="w-full py-3.5 sm:py-4 font-bold text-sm sm:text-base rounded-xl bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 dark:shadow-blue-900/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed outline-none focus-visible:ring-4 focus-visible:ring-blue-500/40">
            {isUploading ? <><Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> Processing...</> : <><CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> Continue to Agreement</>}
          </button>
        )}

        {recorderState === 'review' && (
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 animate-in slide-in-from-bottom-2">
            <button type="button" onClick={retake} className="w-full sm:flex-1 py-3.5 sm:py-4 text-sm sm:text-base font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 active:scale-[0.98] outline-none focus-visible:ring-4 focus-visible:ring-slate-500/20">
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" /> Retake
            </button>
            <button type="submit" disabled={isUploading} className="w-full sm:flex-1 py-3.5 sm:py-4 text-sm sm:text-base font-bold rounded-xl bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 dark:shadow-blue-900/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed outline-none focus-visible:ring-4 focus-visible:ring-blue-500/40">
              {isUploading ? <><Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> Uploading...</> : <><CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> Continue to Agreement</>}
            </button>
          </div>
        )}
      </div>
    </form>
  );
});

export default StepThree;