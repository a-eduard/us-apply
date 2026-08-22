"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Loader2, Mail, Lock, ChevronLeft } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (res?.error) {
        setError("Invalid email or password");
        setIsLoading(false);
      } else {
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        const userRole = sessionData?.user?.role;

        if (userRole === "Employer") {
          router.push("/dashboard/employer");
        } else {
          router.push("/dashboard/candidate");
        }
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: "google" | "linkedin") => {
    signIn(provider, { callbackUrl: "/dashboard/candidate" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans transition-colors duration-300 relative overflow-hidden">
      
      {/* Decorative background blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-72 sm:w-96 h-72 sm:h-96 bg-blue-500/10 blur-[80px] sm:blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-72 sm:w-96 h-72 sm:h-96 bg-rose-500/10 blur-[80px] sm:blur-[100px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md p-6 sm:p-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-xl dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-slate-200/60 dark:border-slate-800/60 transition-colors duration-300 relative z-10">
        
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-6 group outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md pr-2">
          <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> Back to Home
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2 transition-colors tracking-tight">Welcome Back</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 transition-colors">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm rounded-xl text-center font-bold shadow-sm animate-in fade-in transition-colors">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 dark:text-slate-500" />
              <input
                {...register("email")}
                type="email"
                placeholder="you@example.com"
                className="w-full pl-11 sm:pl-12 pr-4 py-3 bg-white dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-blue-600/10 dark:focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all text-sm shadow-sm"
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="mt-1.5 text-xs font-bold text-rose-500 dark:text-rose-400">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 dark:text-slate-500" />
              <input
                {...register("password")}
                type="password"
                placeholder="••••••••"
                className="w-full pl-11 sm:pl-12 pr-4 py-3 bg-white dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-blue-600/10 dark:focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all text-sm shadow-sm"
                disabled={isLoading}
              />
            </div>
            {errors.password && (
              <p className="mt-1.5 text-xs font-bold text-rose-500 dark:text-rose-400">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 dark:shadow-blue-900/20 active:scale-[0.98] mt-2 text-sm sm:text-base outline-none focus-visible:ring-4 focus-visible:ring-blue-500/40"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
          </button>
        </form>

        <div className="mt-8 flex items-center gap-4">
          <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1 transition-colors"></div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest transition-colors">Or continue with</span>
          <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1 transition-colors"></div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
          <button
            type="button"
            disabled
            title="Coming soon"
            className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-bold text-slate-400 dark:text-slate-500 opacity-60 cursor-not-allowed shadow-sm transition-colors"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 opacity-70 grayscale" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>
          <button
            type="button"
            disabled
            title="Coming soon"
            className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-bold text-slate-400 dark:text-slate-500 opacity-60 cursor-not-allowed shadow-sm transition-colors"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 opacity-70 grayscale" fill="#0077B5" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            LinkedIn
          </button>
        </div>

        <div className="mt-8 text-center text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 transition-colors">
          Don't have an account?{" "}
          <Link href="/register" className="text-blue-600 dark:text-blue-400 font-bold hover:underline outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm">
            Sign up here
          </Link>
        </div>
      </div>
    </div>
  );
}