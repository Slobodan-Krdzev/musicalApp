import { z } from 'zod';

const locationSchema = z.object({
  city: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
});

const socialLinksSchema = z.object({
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  youtube: z.string().optional(),
  spotify: z.string().optional(),
}).optional();

export const musicianProfileSchema = z.object({
  bandName: z.string().max(200).optional(),
  bio: z.string().max(5000).optional(),
  genres: z.array(z.string().max(100)).max(50).optional(),
  location: locationSchema.optional(),
  services: z.array(z.string().max(100)).max(30).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  images: z.array(z.string()).max(20).optional(),
  interests: z.array(z.string().max(100)).max(30).optional(),
  expectationsFromApp: z.array(z.string().max(200)).max(20).optional(),
  paymentPreferences: z.string().max(1000).optional(),
  socialLinks: socialLinksSchema,
  contactPhone: z.string().max(30).optional(),
});

const venueLocationSchema = z.object({
  address: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const venueProfileSchema = z.object({
  venueName: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
  capacity: z.number().min(0).optional(),
  location: venueLocationSchema.optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  images: z.array(z.string()).max(20).optional(),
  gigTypes: z.array(z.string().max(100)).max(30).optional(),
  servicesInterestedIn: z.array(z.string().max(100)).max(30).optional(),
  interests: z.array(z.string().max(100)).max(30).optional(),
  expectationsFromApp: z.array(z.string().max(200)).max(20).optional(),
  paymentPreferences: z.string().max(1000).optional(),
  providesAudioEquipment: z.boolean().optional(),
  audioEquipmentDescription: z.string().max(2000).optional(),
  providesSoundEngineer: z.boolean().optional(),
  providesLightingEquipment: z.boolean().optional(),
  lightingEquipmentDescription: z.string().max(2000).optional(),
  hasDedicatedStage: z.boolean().optional(),
  stageDescription: z.string().max(2000).optional(),
  socialLinks: socialLinksSchema,
  contactPhone: z.string().max(30).optional(),
  reservationPhone: z.string().max(30).optional(),
});
