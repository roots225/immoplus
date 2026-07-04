import { z } from "zod";

// Schémas Zod — validation de toutes les données entrantes (API Routes, Server Actions)

export const AnalyseUrlSchema = z.object({
  url: z
    .string()
    .url("URL invalide")
    .max(2048)
    .refine(
      (u) => /^https:\/\//.test(u),
      "Seules les URLs HTTPS sont acceptées"
    ),
});

export const ChatMessageSchema = z.object({
  message: z.string().min(1).max(2000),
});

export const RenovEstimateSchema = z.object({
  photoUrls: z.array(z.string().url()).min(1).max(5),
  surface: z.number().positive().max(2000).optional(),
  propertyType: z.enum(["APARTMENT", "HOUSE", "LAND", "COMMERCIAL", "OTHER"]).optional(),
});

export const DealCreateSchema = z.object({
  title: z.string().min(10).max(150),
  description: z.string().min(30).max(5000),
  sourceUrl: z.string().url().optional(),
  price: z.number().int().positive().max(50_000_000),
  surface: z.number().positive().max(10_000).optional(),
  city: z.string().min(1).max(100),
  postalCode: z.string().regex(/^\d{5}$/, "Code postal invalide"),
  propertyType: z.enum(["APARTMENT", "HOUSE", "LAND", "COMMERCIAL", "OTHER"]).default("APARTMENT"),
  imageUrl: z.string().url().optional(),
});

export const DealUpdateSchema = DealCreateSchema.partial().extend({
  status: z.enum(["ACTIVE", "EXPIRED", "SOLD", "REMOVED"]).optional(),
});

export const VoteSchema = z.object({
  type: z.enum(["HOT", "COLD"]),
});

export const CommentCreateSchema = z.object({
  content: z.string().min(1).max(2000),
  parentId: z.string().cuid().optional(),
});

export const AlertCreateSchema = z.object({
  name: z.string().min(1).max(100),
  city: z.string().min(1).max(100),
  postalCodes: z.array(z.string().regex(/^\d{5}$/)).max(20).default([]),
  budgetMin: z.number().int().positive().optional(),
  budgetMax: z.number().int().positive().optional(),
  surfaceMin: z.number().positive().optional(),
  propertyType: z.enum(["APARTMENT", "HOUSE", "LAND", "COMMERCIAL", "OTHER"]).optional(),
  frequency: z.enum(["INSTANT", "DAILY", "WEEKLY"]).default("DAILY"),
});

export const BuyerCreateSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  status: z.enum(["PROSPECT", "ACTIVE", "OFFER_MADE", "CLOSED", "LOST"]).default("PROSPECT"),
  budgetMin: z.number().int().positive().optional(),
  budgetMax: z.number().int().positive().optional(),
  cities: z.array(z.string()).max(20).default([]),
  propertyType: z.enum(["APARTMENT", "HOUSE", "LAND", "COMMERCIAL", "OTHER"]).optional(),
  notes: z.string().max(5000).optional(),
});

export const CheckoutSchema = z.object({
  plan: z.enum(["STARTER", "PRO", "AGENCY"]),
});

export const PdfReportSchema = z.object({
  analysisId: z.string().cuid(),
  whiteLabel: z.boolean().default(false),
});

export const BarometreQuerySchema = z.object({
  lat: z.coerce.number().min(41).max(52),
  lng: z.coerce.number().min(-5.5).max(10),
  radius: z.coerce.number().int().min(100).max(5000).default(500),
});
