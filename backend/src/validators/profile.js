import { z } from 'zod';

const locationSchema = z.object({
  city: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
});

const socialLinksSchema = z.object({
  website: z.string().url().optional().or(z.literal('')),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  youtube: z.string().optional(),
  spotify: z.string().optional(),
}).optional();

export const musicianProfileSchema = z.object({
  bandName: z.string().max(200).optional(),
  bio: z.string().max(5000).optional(),
  genres: z.array(z.string().max(100)).max(20).optional(),
  location: locationSchema.optional(),
  performanceRadiusKm: z.number().min(0).max(2000).optional(),
  images: z.array(z.string()).max(10).optional(),
  videos: z.array(z.object({ url: z.string().url(), platform: z.string() })).max(10).optional(),
  socialLinks: socialLinksSchema,
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
}).strict();

const venueLocationSchema = z.object({
  address: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
});

export const venueProfileSchema = z.object({
  venueName: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
  capacity: z.number().min(0).optional(),
  location: venueLocationSchema.optional(),
  images: z.array(z.string()).max(10).optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
}).strict();
