"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronLeft, Loader2, Building2, Briefcase, Image as ImageIcon, UploadCloud, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const campaignSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  companyName: z.string().optional(), 
  niche: z.string().optional(),
  salesType: z.string().optional(),
  shortDescription: z.string().optional(), 
  description: z.string().optional(),
  requirements: z.string().optional(),
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

export default function NewCampaignPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: CampaignFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      let finalLogoUrl = null;

      if (logoFile) {
        const formData = new FormData();
        formData.append("file", logoFile);
        formData.append("folder", "logos"); 
        
        const uploadRes = await fetch('/api/upload', { 
          method: 'POST',
          body: formData
        });
        
        const uploadData = await uploadRes.json();
        
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || 'Failed to upload logo to S3');
        }
        
        finalLogoUrl = uploadData.publicUrl;
      }

      const payload = { 
        ...data, 
        short_description: data.shortDescription,
        logoUrl: finalLogoUrl 
      };

      const response = await fetch("/api/employer/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.error || "Failed to create campaign");
      }

      router.refresh();
      router.push("/dashboard/employer");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  const inputClasses = "w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all font-medium shadow-sm";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 relative transition-colors duration-300 pb-12">
      <style>{`header { display: none !important; }`}</style>

      {/* Header */}
      <nav className="h-16 sm:h-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-50 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => router.push('/dashboard/employer')}>
          <img src="/usc_logo.png" alt="USclosers Logo" className="h-7 sm:h-8 group-hover:opacity-80 transition-opacity shrink-0" />
          <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight group-hover:opacity-80 transition-colors hidden sm:block">
            USclosers
          </span>
        </div>
        <Link
          href="/dashboard/employer"
          className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Dashboard</span>
          <span className="sm:hidden">Back</span>
        </Link>
      </nav>

      <main className="flex-1 w-full max-w-3xl mx-auto p-4 sm:p-8 mt-4 sm:mt-6">
        <div className="mb-6 sm:mb-8 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2 transition-colors">Create New Campaign</h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium transition-colors">Fill in the details below to post a new job opening.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl font-bold shadow-sm transition-colors animate-in fade-in">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-300">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 md:p-10 space-y-8">
            
            {/* Logo Upload */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 transition-colors">Company Logo</label>
              <div className="flex flex-col sm:flex-row items-start gap-5 sm:gap-6">
                <div className="w-24 h-24 shrink-0 bg-slate-50 dark:bg-slate-950/50 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex items-center justify-center overflow-hidden relative group transition-colors">
                  {logoPreview ? (
                    <>
                      <img src={logoPreview} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-6 h-6 text-white" />
                      </button>
                    </>
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                  )}
                </div>
                <div className="flex-1 w-full sm:w-auto">
                  <input 
                    type="file" 
                    accept="image/jpeg, image/png, image/webp" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleImageChange} 
                  />
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-700 dark:text-slate-300 font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <UploadCloud className="w-5 h-5" />
                    Upload Image
                  </button>
                  <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mt-3 transition-colors">Recommended size: 256x256px. Formats: JPG, PNG, WEBP.</p>
                </div>
              </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-800 transition-colors" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 transition-colors">Job Title *</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 dark:text-slate-500" />
                  <input
                    {...register("title")}
                    type="text"
                    placeholder="e.g. Senior Closer"
                    className={cn(inputClasses, "pl-11 sm:pl-12")}
                  />
                </div>
                {errors.title && <p className="mt-1.5 text-xs font-bold text-red-500 dark:text-red-400">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 transition-colors">Company Name</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 dark:text-slate-500" />
                  <input
                    {...register("companyName")}
                    type="text"
                    placeholder="e.g. TechCorp Inc."
                    className={cn(inputClasses, "pl-11 sm:pl-12")}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 transition-colors">Industry / Niche</label>
                <input
                  {...register("niche")}
                  type="text"
                  placeholder="e.g. SaaS, Real Estate"
                  className={inputClasses}
                />
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 transition-colors">Sales Type</label>
                <select
                  {...register("salesType")}
                  className={cn(inputClasses, "appearance-none cursor-pointer")}
                >
                  <option value="" className="dark:bg-slate-900">Select type...</option>
                  <option value="B2B" className="dark:bg-slate-900">B2B</option>
                  <option value="B2C" className="dark:bg-slate-900">B2C</option>
                  <option value="Inbound" className="dark:bg-slate-900">Inbound</option>
                  <option value="Outbound" className="dark:bg-slate-900">Outbound</option>
                  <option value="Full Cycle" className="dark:bg-slate-900">Full Cycle</option>
                  <option value="Enterprise" className="dark:bg-slate-900">Enterprise</option>
                  <option value="Account Management" className="dark:bg-slate-900">Account Management</option>
                  <option value="Both" className="dark:bg-slate-900">Both / Mixed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 transition-colors">Short Description (for Home Page Card)</label>
              <textarea
                {...register("shortDescription")}
                rows={3}
                placeholder="A brief 1-2 sentence summary of the role..."
                className={cn(inputClasses, "resize-y")}
              ></textarea>
            </div>

            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 transition-colors">Full Job Description</label>
              <textarea
                {...register("description")}
                rows={8}
                placeholder="Detailed description including responsibilities, day-to-day tasks, etc..."
                className={cn(inputClasses, "resize-y")}
              ></textarea>
            </div>

            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 transition-colors">Requirements</label>
              <textarea
                {...register("requirements")}
                rows={5}
                placeholder="List the required skills and experience..."
                className={cn(inputClasses, "resize-y")}
              ></textarea>
            </div>

            <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-end transition-colors">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold py-3.5 px-10 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 dark:shadow-blue-900/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Publish Campaign"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}