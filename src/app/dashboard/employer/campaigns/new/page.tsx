"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronLeft, Loader2, Building2, Briefcase, Image as ImageIcon, UploadCloud, X, DollarSign, Percent } from "lucide-react";
import Link from "next/link";

const campaignSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  companyName: z.string().optional(), 
  niche: z.string().optional(),
  salesType: z.string().optional(),
  baseSalary: z.string().optional(),
  ote: z.string().optional(),
  commission: z.string().optional(),
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
        
        const uploadRes = await fetch('/api/upload/local', {
          method: 'POST',
          body: formData
        });
        
        const uploadData = await uploadRes.json();
        
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || 'Failed to upload logo locally');
        }
        
        finalLogoUrl = uploadData.publicUrl;
      }

      const payload = { ...data, logoUrl: finalLogoUrl };

      const response = await fetch("/api/employer/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.error || "Failed to create campaign");
      }

      router.push("/dashboard/employer");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 relative">
      <style>{`header { display: none !important; }`}</style>

      <nav className="h-16 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => router.push('/dashboard/employer')}>
          <img src="/usc_logo.png" alt="USclosers Logo" className="h-8 group-hover:opacity-80 transition-opacity shrink-0" />
          <span className="text-xl font-extrabold text-slate-800 tracking-tight group-hover:opacity-80 transition-opacity hidden sm:block">
            USclosers
          </span>
        </div>
        <Link
          href="/dashboard/employer"
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </nav>

      <main className="flex-1 w-full max-w-3xl mx-auto p-4 sm:p-8 mt-4">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Create New Campaign</h1>
          <p className="text-slate-500 font-medium">Fill in the details below to post a new job opening.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl font-bold shadow-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-8">
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">Company Logo</label>
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 shrink-0 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center overflow-hidden relative group">
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
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                  )}
                </div>
                <div className="flex-1">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleImageChange} 
                  />
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white border border-slate-300 hover:border-blue-600 hover:bg-blue-50 text-slate-700 font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm flex items-center gap-2"
                  >
                    <UploadCloud className="w-5 h-5" />
                    Upload Image
                  </button>
                  <p className="text-xs font-medium text-slate-500 mt-3">Recommended size: 256x256px. Formats: JPG, PNG, WEBP.</p>
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Job Title *</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    {...register("title")}
                    type="text"
                    placeholder="e.g. Senior Closer"
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors text-sm"
                  />
                </div>
                {errors.title && <p className="mt-1 text-xs font-bold text-red-500">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Company Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    {...register("companyName")}
                    type="text"
                    placeholder="e.g. TechCorp Inc."
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Industry / Niche</label>
                <input
                  {...register("niche")}
                  type="text"
                  placeholder="e.g. SaaS, Real Estate"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Sales Type</label>
                <select
                  {...register("salesType")}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors text-sm bg-white"
                >
                  <option value="">Select type...</option>
                  <option value="B2B">B2B</option>
                  <option value="B2C">B2C</option>
                  <option value="Inbound">Inbound</option>
                  <option value="Outbound">Outbound</option>
                  <option value="Full Cycle">Full Cycle</option>
                  <option value="Enterprise">Enterprise</option>
                  <option value="Account Management">Account Management</option>
                  <option value="Both">Both / Mixed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Base Salary</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    {...register("baseSalary")}
                    type="text"
                    placeholder="e.g. $4,000/mo"
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">OTE (Earnings)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    {...register("ote")}
                    type="text"
                    placeholder="e.g. $120,000/yr"
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Commission</label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    {...register("commission")}
                    type="text"
                    placeholder="e.g. 15%"
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Job Description</label>
              <textarea
                {...register("description")}
                rows={4}
                placeholder="Describe the role, responsibilities, and benefits..."
                className="w-full px-4 py-4 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors text-sm resize-y"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Requirements</label>
              <textarea
                {...register("requirements")}
                rows={3}
                placeholder="List the required skills and experience..."
                className="w-full px-4 py-4 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors text-sm resize-y"
              ></textarea>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-10 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-70 w-full sm:w-auto"
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