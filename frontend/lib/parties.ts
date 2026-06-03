import { apiRequest } from '@/lib/api';

export type PartyLocation = {
  latitude?: number;
  longitude?: number;
};

export type SocialLinks = {
  facebook?: string;
  instagram?: string;
  youtube?: string;
  spotify?: string;
  [key: string]: string | undefined;
};

export type PartyItem = {
  id: string;
  entityType: 'EVENT' | 'OFFERING';
  entityId: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  venueName: string;
  musicianName: string;
  venueProfile?: {
    avatarUrl?: string;
    images?: string[];
    description?: string;
    socialLinks?: SocialLinks;
    contactPhone?: string | null;
    reservationPhone?: string | null;
  } | null;
  musicianProfile?: {
    avatarUrl?: string;
    images?: string[];
    bio?: string;
    genres?: string[];
    socialLinks?: SocialLinks;
  } | null;
  location?: PartyLocation | null;
  distanceKm?: number | null;
};

export type PartiesResponse = {
  parties: PartyItem[];
  pagination: { page: number; limit: number; total: number; pages: number };
  closestRadiusKm?: number;
};

export type PartyFilters = {
  q?: string;
  tags?: string;
  dateFrom?: string;
  dateTo?: string;
  timeFrom?: string;
  timeTo?: string;
  lat?: string;
  lng?: string;
  closest?: string;
  page?: string;
  limit?: string;
};

export async function fetchParties(filters: PartyFilters = {}): Promise<PartiesResponse> {
  const params: Record<string, string> = {};
  Object.entries(filters).forEach(([k, v]) => {
    if (v) params[k] = v;
  });
  return apiRequest<PartiesResponse>('/api/parties', { params, token: null });
}

export function partyDisplayTitle(party: PartyItem) {
  return `${party.musicianName} at ${party.venueName}`;
}

export function googleMapsDirectionsUrl(location?: PartyLocation | null) {
  if (!location?.latitude || !location?.longitude) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`;
}
