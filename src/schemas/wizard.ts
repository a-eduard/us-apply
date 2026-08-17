import { z } from "zod";

export const OtpVerificationSchema = z.object({
  code: z.string()
    .regex(/^\d+$/, "Code must contain only numbers")
    .length(6, "Code must be exactly 6 digits"),
});
export const OtpSchema = OtpVerificationSchema;

export const ProfileEnrichmentSchema = z.object({
  firstName: z.string()
    .trim()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name is too long"),
  lastName: z.string()
    .trim()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name is too long"),
  email: z.string()
    .min(1, "Email is required")
    .email("Please enter a valid email address (e.g., name@example.com)"),
  password: z.string().optional(), // Added for integrated registration
  city: z.string().trim().min(2, "Please enter your city"),
  state: z.string().trim().min(1, "Please specify your state or country").max(100, "Value is too long"),
});
export const StepOneSchema = ProfileEnrichmentSchema;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_FILE_TYPES = ["application/pdf"];
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const StepTwoSchema = z.object({
  avatarFile: z.any()
    .optional()
    .refine(
      (file) => !file || file.size <= MAX_FILE_SIZE, 
      "Image size exceeds 5MB."
    )
    .refine(
      (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only .jpg, .png, and .webp formats are supported"
    ),

  yearsOfExperience: z.string().min(1, "Please select your work experience"),
  
  niches: z.array(z.string())
    .min(1, "Select at least one niche")
    .max(3, "You can select up to 3 specializations"),
    
  linkedinUrl: z.string()
    .min(1, "LinkedIn URL is required")
    .url("Invalid URL format")
    .startsWith("https://", "URL must start with https://"),
    
  resumeFile: z.any()
    .optional()
    .refine(
      (file) => !file || file.size <= MAX_FILE_SIZE, 
      "File size exceeds 5MB. Please compress your PDF."
    )
    .refine(
      (file) => !file || ACCEPTED_FILE_TYPES.includes(file.type),
      "Only .pdf format is supported"
    ),
});

const MAX_MEDIA_SIZE = 50 * 1024 * 1024; // 50 MB
const ACCEPTED_TYPES = [
  "video/mp4", "video/webm", "video/quicktime", 
  "audio/mp3", "audio/webm", "audio/mp4", "audio/mpeg"
];

export const StepThreeSchema = z.object({
  pitchMethod: z.enum(["video", "audio"]),
  mediaFile: z.any()
    .refine((file) => file, "Please record a video or audio pitch before proceeding")
    .refine(
      (file) => file?.size <= MAX_MEDIA_SIZE,
      "Recording is too large. Maximum size is 50 MB."
    )
    .refine(
      (file) => ACCEPTED_TYPES.includes(file?.type),
      "Unsupported format. Please record using the browser."
    ),
});

export const generateScreeningSchema = (questions: Array<{ id: string; type: string; isRequired: boolean }>) => {
  const schemaShape: Record<string, any> = {};

  questions.forEach((q) => {
    if (q.type === "text") {
      schemaShape[q.id] = q.isRequired
        ? z.string().trim().min(10, "Please provide a more detailed answer (at least 10 characters)")
        : z.string().optional();
    }
    
    if (q.type === "multiple_choice") {
      schemaShape[q.id] = q.isRequired
        ? z.string().min(1, "Please select one of the options")
        : z.string().optional();
    }
  });

  return z.object(schemaShape);
};

export const EmailAuthSchema = z.object({
  email: z.string()
    .min(1, "Email is required")
    .email("Please enter a valid email address (e.g., name@example.com)"),
});
export const EmailSchema = EmailAuthSchema;

export const ALLOWED_NICHES = [
  "SaaS / Cloud Software", "AI / Machine Learning", "Cybersecurity", "Data Analytics / BI", "DevOps / IT Infrastructure",
  "FinTech", "LegalTech", "InsurTech", "Web3 / Crypto / Blockchain",
  "HealthTech / MedTech", "EdTech", "BioTech",
  "E-commerce / RetailTech", "Supply Chain / LogisticsTech", "PropTech / Real Estate",
  "HRTech / Recruiting", "MarTech / AdTech", "SalesTech", "ERP / Business Management",
  "Hardware / IoT", "CleanTech / GreenTech", "GovTech", "Manufacturing / Industry 4.0", "Telecom"
];

export const ScreeningSchema = z.object({
  primaryRole: z.enum(["Hunter (SDR/BDR)", "Closer (AE)", "Full-Cycle"]),
  salesCycle: z.enum(["1-Call Close", "1-4 weeks", "3-6 months", "6-12+ months"]),
  targetAudience: z.array(z.string()).min(1),
  decisionMaker: z.array(z.string()).min(1),
  averageTicketSize: z.string().min(1),
  productComplexity: z.enum(["Simple / Tangible", "Moderate / Workflow", "Highly Technical"]),
  industryNiches: z.array(z.string())
    .min(1, "Please select at least one industry niche")
    .max(5, "You can select up to 5 niches")
    .refine(
      (niches) => niches.every((niche) => ALLOWED_NICHES.includes(niche)),
      "Invalid niche selected"
    ),
});