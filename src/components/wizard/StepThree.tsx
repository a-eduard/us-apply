"use client";

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { StepThreeSchema } from '@/schemas/wizard';
import { cn } from '@/lib/utils';
import { Video, Mic, StopCircle, RefreshCw, CheckCircle2, Camera, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

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
  
  const { handleSubmit, formState: { errors }, setValue, watch, trigger, getValues } = useForm({
    resolver: zodResolver(StepThreeSchema),
    defaultValues: {
      pitchMethod: defaultValues?.pitchMethod === 'audio' ? 'audio' : 'video',
      mediaFile: null
    }
  });

  useImperativeHandle(ref, () => ({
    getValues: () => getValues(),
    validateAndSubmit: async () => {
      if (!mediaFile) {
        onNext({});
        return true;
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

  const pitchMethod = watch('pitchMethod');
  const mediaFile = watch('mediaFile');
  
  const [recorderState, setRecorderState] = useState<'idle' | 'recording' | 'review'>('idle');
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement>(null);
  
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
          video: pitchMethod === 'video' ? { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } : false, 
          audio: true 
        };
        newStream = await navigator.mediaDevices.getUserMedia(constraints1);
      } catch (err: any) {
        if (err.name === 'NotFoundError' || err.name === 'OverconstrainedError') {
          try {
            const constraints2 = { 
              video: pitchMethod === 'video', 
              audio: true 
            };
            newStream = await navigator.mediaDevices.getUserMedia(constraints2);
          } catch (err2: any) {
             throw new Error("Browser cannot find required devices. Check your connection.");
          }
        } else {
          throw err;
        }
      }
      
      setStream(newStream);
      
      if (pitchMethod === 'video' && videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = newStream;
        videoPreviewRef.current.muted = true;
      }
      
      let mimeType = pitchMethod === 'video' ? 'video/webm' : 'audio/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = pitchMethod === 'video' ? 'video/mp4' : 'audio/mp4';
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
        
        if (pitchMethod === 'video' && videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null;
          videoPreviewRef.current.src = URL.createObjectURL(blob);
          videoPreviewRef.current.controls = true;
          videoPreviewRef.current.muted = false;
        } else if (pitchMethod === 'audio' && audioPreviewRef.current) {
          audioPreviewRef.current.src = URL.createObjectURL(blob);
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
    setValue('mediaFile', null);
    setRecorderState('idle');
    setMediaError(null);
    if (videoPreviewRef.current) {
      videoPreviewRef.current.src = '';
      videoPreviewRef.current.controls = false;
    }
    if (audioPreviewRef.current) {
      audioPreviewRef.current.src = '';
    }
    setTimer(0);
  };

  const handleSkip = () => {
    setIsUploading(true);
    onNext({}); 
  };

  const submitForm = async () => {
    if (!mediaFile) {
      handleSkip();
      return;
    }
    
    setIsUploading(true);
    try {
      // 1. ПОЛУЧАЕМ ПРЕСАЙН-УРЛ
      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: mediaFile.name,
          fileType: mediaFile.type,
          isVideo: pitchMethod === 'video'
        })
      });
      const presignData = await presignRes.json();
      
      if (!presignRes.ok) throw new Error(presignData.error || 'Failed to get upload URL');

      // 2. ЗАГРУЖАЕМ ФАЙЛ ПРЯМО В AWS
      const uploadRes = await fetch(presignData.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': mediaFile.type },
        body: mediaFile
      });
      
      if (!uploadRes.ok) throw new Error('Failed to upload to S3');
      
      const videoPitchUrl = presignData.publicUrl;
      const userId = session?.user ? (session.user as any).id : null;

      // 3. СОХРАНЯЕМ ССЫЛКУ НА ВИДЕО В ПРОФИЛЬ
      if (userId) {
        await fetch(`/api/users/${userId}/profile`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ video_pitch_url: videoPitchUrl })
        });
      }

      onNext({ pitchMethod, videoPitchUrl });
    } catch (err) {
      console.error(err);
      alert('Upload failed. Please try again.');
      setIsUploading(false);
    } 
  };
  
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const setMethod = (method: 'video' | 'audio') => {
    setValue('pitchMethod', method);
    retake();
  };

  return (
    <form onSubmit={handleSubmit(submitForm)} className="space-y-5 sm:space-y-6 bg-white p-4 sm:p-8 rounded-2xl shadow-sm border border-slate-200 max-w-2xl mx-auto mt-4 sm:mt-8 relative">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 sm:p-4 flex items-start gap-3">
        <span className="text-lg sm:text-xl shrink-0 mt-0.5">💡</span>
        <p className="text-xs sm:text-sm text-blue-900 font-medium leading-relaxed">
          Stand out from the crowd! Candidates who record a video pitch receive 3x more employer interest.
        </p>
      </div>

      <div className="flex gap-3 sm:gap-4">
        <button 
          type="button"
          onClick={() => setMethod('video')}
          disabled={recorderState === 'recording'}
          className={cn(
            "flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base font-bold transition-all border",
            pitchMethod === 'video' 
              ? "bg-blue-600 text-white border-blue-600 shadow-md" 
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300",
            recorderState === 'recording' && "opacity-50 cursor-not-allowed"
          )}
        >
          <Camera className="w-4 h-4 sm:w-5 sm:h-5" /> Record Video
        </button>
        <button 
          type="button"
          onClick={() => setMethod('audio')}
          disabled={recorderState === 'recording'}
          className={cn(
            "flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base font-bold transition-all border",
            pitchMethod === 'audio' 
              ? "bg-blue-600 text-white border-blue-600 shadow-md" 
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300",
            recorderState === 'recording' && "opacity-50 cursor-not-allowed"
          )}
        >
          <Mic className="w-4 h-4 sm:w-5 sm:h-5" /> Audio Only
        </button>
      </div>

      {mediaError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-3 rounded-xl text-xs sm:text-sm flex flex-col gap-2 relative">
          <p className="font-medium pr-6">{mediaError}</p>
          <button type="button" onClick={() => setMediaError(null)} className="absolute top-2.5 right-3 text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      <div className="border border-slate-200 rounded-2xl bg-black aspect-video flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
        {pitchMethod === 'video' && (
          <video ref={videoPreviewRef} className={cn("w-full h-full object-cover", recorderState === 'idle' && "hidden")} playsInline autoPlay />
        )}
        
        {pitchMethod === 'audio' && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 flex-col gap-4">
             {recorderState === 'recording' ? (
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-500 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                    <Mic className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                </motion.div>
             ) : recorderState === 'review' ? (
                <div className="w-full px-4 sm:px-12 z-10"><audio ref={audioPreviewRef} controls className="w-full" /></div>
             ) : (
                <Mic className="w-12 h-12 sm:w-16 sm:h-16 text-slate-600" />
             )}
          </div>
        )}
        
        {recorderState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white p-4 sm:p-6 text-center z-10">
            {pitchMethod === 'video' ? <Camera className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 mb-4 sm:mb-6" /> : null}
            <button type="button" onClick={startRecording} className="mt-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.6)] transition-all hover:scale-105 group">
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white group-hover:scale-90 transition-transform"></div>
            </button>
            <p className="mt-4 sm:mt-6 text-[10px] sm:text-sm text-slate-300 font-bold tracking-widest uppercase">Click to start recording</p>
            <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-slate-500 font-medium">Maximum duration: 2 minutes</p>
          </div>
        )}

        {recorderState === 'recording' && (
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 sm:gap-4 z-20">
            <div className="bg-black/70 backdrop-blur-md text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-full font-mono text-base sm:text-lg flex items-center gap-2 sm:gap-3 shadow-lg border border-white/10">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-500 animate-pulse"></div>
              {formatTime(timer)}
            </div>
            <button type="button" onClick={stopRecording} className="bg-white text-slate-900 hover:bg-slate-200 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shadow-lg transition-transform hover:scale-105">
              <StopCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        )}
      </div>
      
      {errors.mediaFile && (
        <p className="text-xs sm:text-sm font-bold text-red-500 text-center bg-red-50 py-2 sm:py-3 rounded-lg border border-red-100">
          {(errors.mediaFile as any).message}
        </p>
      )}

      {recorderState === 'idle' && (
        <div className="pt-4 sm:pt-6 border-t border-slate-100">
          <button type="button" onClick={handleSkip} disabled={isUploading} className="w-full py-3.5 sm:py-4 font-bold text-sm sm:text-base rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-70">
            {isUploading ? <><Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> Processing...</> : <>{campaignId ? "Skip for now & Submit Application" : "Skip & Save Profile"} <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" /></>}
          </button>
          <p className="text-[10px] sm:text-xs text-slate-500 text-center mt-2.5 sm:mt-3 font-medium">
            You can always record your pitch later from your candidate dashboard.
          </p>
        </div>
      )}

      {recorderState === 'review' && (
        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 pt-4 border-t border-slate-100">
           <button type="button" onClick={retake} className="w-full sm:flex-1 py-3 sm:py-3.5 text-sm sm:text-base font-bold rounded-xl border-2 border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
             <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" /> Retake
           </button>
           <button type="submit" disabled={isUploading} className="w-full sm:flex-1 py-3 sm:py-3.5 text-sm sm:text-base font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-70">
             {isUploading ? <><Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> Uploading...</> : <><CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> {campaignId ? "Submit Application" : "Complete Profile"}</>}
           </button>
        </div>
      )}
    </form>
  );
});

export default StepThree;