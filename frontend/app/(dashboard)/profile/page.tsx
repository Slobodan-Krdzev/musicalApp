'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/api';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { COUNTRIES } from '@/lib/countries';
import {
  MUSICIAN_GENRES,
  MUSICIAN_SERVICES,
  VENUE_SERVICES,
  VENUE_GIG_TYPES,
  EXPECTATIONS_OPTIONS,
} from '@/lib/profileOptions';

const VenueMapPicker = dynamic(() => import('@/components/VenueMapPicker'), { ssr: false });

// ── Types ──

type MusicianProfile = {
  bandName?: string;
  bio?: string;
  genres?: string[];
  services?: string[];
  location?: { city?: string; region?: string; country?: string };
  interests?: string[];
  expectationsFromApp?: string[];
  paymentPreferences?: string;
  avatarUrl?: string;
  images?: string[];
  socialLinks?: { facebook?: string; instagram?: string; youtube?: string; spotify?: string };
  contactPhone?: string;
};

type VenueProfile = {
  venueName?: string;
  description?: string;
  capacity?: number;
  location?: { address?: string; city?: string; region?: string; country?: string; latitude?: number; longitude?: number };
  gigTypes?: string[];
  servicesInterestedIn?: string[];
  interests?: string[];
  expectationsFromApp?: string[];
  paymentPreferences?: string;
  avatarUrl?: string;
  images?: string[];
  providesAudioEquipment?: boolean;
  audioEquipmentDescription?: string;
  providesSoundEngineer?: boolean;
  providesLightingEquipment?: boolean;
  lightingEquipmentDescription?: string;
  hasDedicatedStage?: boolean;
  stageDescription?: string;
  socialLinks?: { facebook?: string; instagram?: string; youtube?: string; spotify?: string };
  contactPhone?: string;
};

type AnyProfile = MusicianProfile | VenueProfile;

const STEPS_MUSICIAN = ['Basic', 'Location', 'Genres & Services', 'Interests', 'Expectations', 'Media', 'Contact'] as const;
const STEPS_VENUE = ['Basic', 'Location', 'Services & Gigs', 'Interests', 'Expectations', 'Equipment', 'Media', 'Contact'] as const;

// ── Helpers ──

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Failed to read file'));
    r.readAsDataURL(file);
  });
}

// ── Checkbox Group Component ──

function CheckboxGroup({
  label,
  options,
  selected,
  onChange,
  withOther = false,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (vals: string[]) => void;
  withOther?: boolean;
}) {
  const [otherValue, setOtherValue] = useState('');
  const knownSet = new Set(options);
  const otherItems = selected.filter((s) => !knownSet.has(s));
  const showOtherChecked = otherItems.length > 0;

  function toggle(val: string) {
    if (selected.includes(val)) {
      onChange(selected.filter((s) => s !== val));
    } else {
      onChange([...selected, val]);
    }
  }

  function addOther() {
    const trimmed = otherValue.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
      setOtherValue('');
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-3">{label}</label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {options.map((opt) => (
          <label
            key={opt}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition-colors text-sm ${
              selected.includes(opt)
                ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500'
            }`}
          >
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => toggle(opt)}
              className="sr-only"
            />
            <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
              selected.includes(opt) ? 'bg-violet-500 border-violet-500' : 'border-zinc-600'
            }`}>
              {selected.includes(opt) && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            {opt}
          </label>
        ))}
      </div>
      {withOther && (
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
              showOtherChecked ? 'bg-violet-500 border-violet-500' : 'border-zinc-600'
            }`}>
              {showOtherChecked && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            <span className="text-sm text-zinc-400">Other</span>
          </div>
          {otherItems.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {otherItems.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-violet-500/20 text-violet-300"
                >
                  {item}
                  <button type="button" onClick={() => onChange(selected.filter((s) => s !== item))} className="hover:text-white">
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type and press Add"
              value={otherValue}
              onChange={(e) => setOtherValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOther())}
              className="flex-1 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
            <Button type="button" variant="secondary" size="sm" onClick={addOther}>Add</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Media Step Component ──

function MediaStep({
  profile,
  onProfileChange,
}: {
  profile: AnyProfile | null;
  onProfileChange: (key: string, value: unknown) => void;
}) {
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setUploadError(null);
    setAvatarUploading(true);
    try {
      const base64 = await readFileAsDataUrl(file);
      const data = await apiRequest<{ url: string }>('/api/upload/image', {
        method: 'POST',
        body: JSON.stringify({ base64 }),
      });
      onProfileChange('avatarUrl', data.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  }

  async function handleGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setUploadError(null);
    setGalleryUploading(true);
    const current = profile?.images ?? [];
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        const base64 = await readFileAsDataUrl(file);
        const data = await apiRequest<{ url: string }>('/api/upload/image', {
          method: 'POST',
          body: JSON.stringify({ base64 }),
        });
        urls.push(data.url);
      }
      if (urls.length) onProfileChange('images', [...current, ...urls]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setGalleryUploading(false);
      e.target.value = '';
    }
  }

  function removeGalleryImage(index: number) {
    const images = profile?.images ?? [];
    onProfileChange('images', images.filter((_, i) => i !== index));
  }

  const galleryCount = profile?.images?.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Profile Image <span className="text-red-400">*</span>
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          disabled={avatarUploading}
          className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-violet-600 file:text-white hover:file:bg-violet-500"
        />
        {avatarUploading && <p className="text-zinc-500 text-sm mt-1">Uploading...</p>}
        {profile?.avatarUrl && (
          <div className="mt-3 relative w-28 h-28 rounded-full overflow-hidden bg-zinc-800 border-2 border-violet-500">
            <Image src={profile.avatarUrl} alt="Avatar" fill className="object-cover" unoptimized />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Gallery <span className="text-red-400">*</span>
          <span className="text-zinc-500 font-normal ml-2">(minimum 3 images)</span>
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleGalleryChange}
          disabled={galleryUploading}
          className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-violet-600 file:text-white hover:file:bg-violet-500"
        />
        {galleryUploading && <p className="text-zinc-500 text-sm mt-1">Uploading...</p>}
        {galleryCount > 0 && galleryCount < 3 && (
          <p className="text-amber-400 text-sm mt-1">
            {3 - galleryCount} more image{3 - galleryCount > 1 ? 's' : ''} required
          </p>
        )}
        <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {(profile?.images ?? []).map((url, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800 group">
              <Image src={url} alt="" fill className="object-cover" unoptimized sizes="120px" />
              <button
                type="button"
                onClick={() => removeGalleryImage(i)}
                className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition text-white text-sm font-medium"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
      {uploadError && <p className="text-red-400 text-sm">{uploadError}</p>}
    </div>
  );
}

// ── Main Wizard ──

export default function ProfileWizardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const isMusician = user?.role === 'MUSICIAN';
  const isVenue = user?.role === 'VENUE';

  const steps = isMusician ? STEPS_MUSICIAN : STEPS_VENUE;

  const { data, isLoading } = useQuery({
    queryKey: ['me-profile'],
    queryFn: () => apiRequest<{ profile: AnyProfile | null }>('/api/users/me/profile'),
    enabled: !!user,
  });

  const [stepIndex, setStepIndex] = useState(0);
  const [profile, setProfile] = useState<AnyProfile>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  useEffect(() => {
    if (data?.profile) setProfile(data.profile);
  }, [data?.profile]);

  // Leave-page guard
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const updateMutation = useMutation({
    mutationFn: (body: AnyProfile) =>
      apiRequest('/api/users/me/profile', {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me-profile'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      router.push('/verify-email');
    },
  });

  const currentStep = steps[stepIndex];

  function handleChange(key: string, value: unknown) {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function handleLocationChange(field: string, value: unknown) {
    setProfile((prev) => ({
      ...prev,
      location: { ...(prev as VenueProfile).location, [field]: value },
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`location.${field}`];
      return next;
    });
  }

  function handleSocialChange(field: string, value: string) {
    setProfile((prev) => ({
      ...prev,
      socialLinks: { ...(prev as MusicianProfile).socialLinks, [field]: value },
    }));
  }

  // ── Validation ──

  function validateStep(): boolean {
    const newErrors: Record<string, string> = {};

    if (currentStep === 'Basic') {
      if (isMusician) {
        if (!(profile as MusicianProfile).bandName?.trim()) newErrors.bandName = 'Band/Artist name is required';
        if (!(profile as MusicianProfile).bio?.trim()) newErrors.bio = 'Description is required';
      } else {
        if (!(profile as VenueProfile).venueName?.trim()) newErrors.venueName = 'Venue name is required';
        if (!(profile as VenueProfile).description?.trim()) newErrors.description = 'Description is required';
      }
    }

    if (currentStep === 'Location') {
      if (!profile.location?.city?.trim()) newErrors['location.city'] = 'City is required';
      if (!profile.location?.region?.trim()) newErrors['location.region'] = 'Region is required';
      if (!profile.location?.country?.trim()) newErrors['location.country'] = 'Country is required';
      if (isVenue) {
        const loc = (profile as VenueProfile).location;
        if (!loc?.address?.trim()) newErrors['location.address'] = 'Address is required';
      }
    }

    if (currentStep === 'Interests') {
      if (!profile.interests?.length) newErrors.interests = 'At least one interest is required';
    }

    if (currentStep === 'Media') {
      if (!profile.avatarUrl) newErrors.avatarUrl = 'Profile image is required';
      if ((profile.images?.length ?? 0) < 3) newErrors.images = 'At least 3 gallery images are required';
    }

    if (currentStep === 'Contact') {
      if (isMusician && !(profile as MusicianProfile).contactPhone?.trim()) {
        newErrors.contactPhone = 'Phone number is required';
      }
      if (isVenue && !(profile as VenueProfile).contactPhone?.trim()) {
        newErrors.contactPhone = 'Phone number is required';
      }
    }

    if (currentStep === 'Equipment') {
      const vp = profile as VenueProfile;
      if (vp.capacity == null || vp.capacity <= 0) newErrors.capacity = 'Approximate capacity is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function goNext() {
    if (!validateStep()) return;
    if (stepIndex < steps.length - 1) setStepIndex(stepIndex + 1);
  }

  function goBack() {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  }

  function buildPayload(): AnyProfile {
    if (isMusician) {
      const p = profile as MusicianProfile;
      return {
        bandName: p.bandName || '',
        bio: p.bio || '',
        genres: p.genres || [],
        location: p.location || undefined,
        services: p.services || [],
        avatarUrl: p.avatarUrl || '',
        images: p.images || [],
        interests: p.interests || [],
        expectationsFromApp: p.expectationsFromApp || [],
        paymentPreferences: p.paymentPreferences || '',
        socialLinks: p.socialLinks || undefined,
        contactPhone: p.contactPhone || '',
      };
    }
    const p = profile as VenueProfile;
    return {
      venueName: p.venueName || '',
      description: p.description || '',
      capacity: p.capacity || undefined,
      location: p.location || undefined,
      avatarUrl: p.avatarUrl || '',
      images: p.images || [],
      gigTypes: p.gigTypes || [],
      servicesInterestedIn: p.servicesInterestedIn || [],
      interests: p.interests || [],
      expectationsFromApp: p.expectationsFromApp || [],
      paymentPreferences: p.paymentPreferences || '',
      providesAudioEquipment: p.providesAudioEquipment || false,
      audioEquipmentDescription: p.audioEquipmentDescription || '',
      providesSoundEngineer: p.providesSoundEngineer || false,
      providesLightingEquipment: p.providesLightingEquipment || false,
      lightingEquipmentDescription: p.lightingEquipmentDescription || '',
      hasDedicatedStage: p.hasDedicatedStage || false,
      stageDescription: p.stageDescription || '',
      socialLinks: p.socialLinks || undefined,
      contactPhone: p.contactPhone || '',
    };
  }

  function handleSave() {
    if (!validateStep()) return;
    updateMutation.mutate(buildPayload());
  }

  function handleLeaveAttempt() {
    setShowLeaveModal(true);
  }

  function confirmLeave() {
    setShowLeaveModal(false);
    window.removeEventListener('beforeunload', () => {});
    router.push('/');
  }

  if (!user || (!isMusician && !isVenue)) {
    return (
      <div className="mx-auto max-w-7xl px-3 py-10 sm:px-4">
        <p className="text-zinc-400 text-sm">Profile wizard is only available for musicians and venues.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-3 py-6 sm:px-4 sm:py-10">
      {/* Leave-page modal */}
      <Modal open={showLeaveModal} onClose={() => setShowLeaveModal(false)} title="Leave profile creation?">
        <p className="text-zinc-300 text-sm mb-4">
          All your progress will be lost. Are you sure you want to leave?
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" size="sm" onClick={() => setShowLeaveModal(false)} className="w-full sm:w-auto">Stay</Button>
          <Button variant="danger" size="sm" onClick={confirmLeave} className="w-full sm:w-auto">Leave</Button>
        </div>
      </Modal>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-50">Complete your profile</h1>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1">
            Fill in each step so we can match you with the right {isMusician ? 'venues' : 'artists'}.
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <Badge variant="default">Step {stepIndex + 1} of {steps.length}</Badge>
          <Button variant="ghost" size="sm" onClick={handleLeaveAttempt}>Exit</Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex gap-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= stepIndex ? 'bg-violet-500' : 'bg-zinc-800'
              }`}
            />
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2">
            {steps.map((label, index) => (
              <div
                key={label}
                className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  index === stepIndex
                    ? 'bg-violet-500 text-white'
                    : index < stepIndex
                    ? 'bg-zinc-800 text-zinc-200'
                    : 'bg-zinc-900 text-zinc-500'
                }`}
              >
                <span>{index + 1}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6 min-h-[300px]">
          {isLoading && <p className="text-zinc-400 text-sm">Loading profile...</p>}

          {/* ── Step: Basic ── */}
          {!isLoading && currentStep === 'Basic' && (
            <>
              <Input
                label={isMusician ? 'Artist / Band Name *' : 'Venue Name *'}
                value={isMusician ? (profile as MusicianProfile).bandName || '' : (profile as VenueProfile).venueName || ''}
                onChange={(e) => handleChange(isMusician ? 'bandName' : 'venueName', e.target.value)}
                error={errors.bandName || errors.venueName}
              />
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  className={`w-full rounded-lg border ${
                    errors.bio || errors.description ? 'border-red-500' : 'border-zinc-700'
                  } bg-zinc-900 p-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500`}
                  rows={4}
                  placeholder={
                    isMusician
                      ? 'Tell venues what kind of music you play and where you perform.'
                      : 'Describe your venue, atmosphere, and what kind of shows you host.'
                  }
                  value={isMusician ? (profile as MusicianProfile).bio || '' : (profile as VenueProfile).description || ''}
                  onChange={(e) => handleChange(isMusician ? 'bio' : 'description', e.target.value)}
                />
                {(errors.bio || errors.description) && (
                  <p className="text-sm text-red-400 mt-1">{errors.bio || errors.description}</p>
                )}
              </div>
            </>
          )}

          {/* ── Step: Location ── */}
          {!isLoading && currentStep === 'Location' && (
            <>
              <Input
                label="City *"
                value={profile.location?.city || ''}
                onChange={(e) => handleLocationChange('city', e.target.value)}
                error={errors['location.city']}
              />
              <Input
                label="Region / State *"
                value={profile.location?.region || ''}
                onChange={(e) => handleLocationChange('region', e.target.value)}
                error={errors['location.region']}
              />
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Country <span className="text-red-400">*</span>
                </label>
                <select
                  value={profile.location?.country || ''}
                  onChange={(e) => handleLocationChange('country', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    errors['location.country'] ? 'border-red-500' : 'border-zinc-700'
                  } bg-zinc-900 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50`}
                >
                  <option value="">Select a country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors['location.country'] && (
                  <p className="text-sm text-red-400 mt-1">{errors['location.country']}</p>
                )}
              </div>
              {isVenue && (
                <>
                  <Input
                    label="Address *"
                    value={(profile as VenueProfile).location?.address || ''}
                    onChange={(e) => handleLocationChange('address', e.target.value)}
                    error={errors['location.address']}
                  />
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Pin your location on the map
                    </label>
                    <VenueMapPicker
                      lat={(profile as VenueProfile).location?.latitude}
                      lng={(profile as VenueProfile).location?.longitude}
                      onLocationSelect={(lat: number, lng: number) => {
                        setProfile((prev) => ({
                          ...prev,
                          location: {
                            ...(prev as VenueProfile).location,
                            latitude: lat,
                            longitude: lng,
                          },
                        }));
                      }}
                    />
                    {(profile as VenueProfile).location?.latitude && (
                      <p className="text-zinc-500 text-xs mt-1">
                        Coordinates: {(profile as VenueProfile).location?.latitude?.toFixed(5)}, {(profile as VenueProfile).location?.longitude?.toFixed(5)}
                      </p>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {/* ── Step: Genres & Services (Musician) ── */}
          {!isLoading && currentStep === 'Genres & Services' && isMusician && (
            <>
              <CheckboxGroup
                label="What genres do you play?"
                options={MUSICIAN_GENRES}
                selected={(profile as MusicianProfile).genres || []}
                onChange={(vals) => handleChange('genres', vals)}
                withOther
              />
              <CheckboxGroup
                label="What services do you offer?"
                options={MUSICIAN_SERVICES}
                selected={(profile as MusicianProfile).services || []}
                onChange={(vals) => handleChange('services', vals)}
                withOther
              />
            </>
          )}

          {/* ── Step: Services & Gigs (Venue) ── */}
          {!isLoading && currentStep === 'Services & Gigs' && isVenue && (
            <>
              <CheckboxGroup
                label="What music services are you interested in?"
                options={VENUE_SERVICES}
                selected={(profile as VenueProfile).servicesInterestedIn || []}
                onChange={(vals) => handleChange('servicesInterestedIn', vals)}
                withOther
              />
              <CheckboxGroup
                label="What kind of gigs do you host?"
                options={VENUE_GIG_TYPES}
                selected={(profile as VenueProfile).gigTypes || []}
                onChange={(vals) => handleChange('gigTypes', vals)}
                withOther
              />
            </>
          )}

          {/* ── Step: Interests ── */}
          {!isLoading && currentStep === 'Interests' && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Your interests <span className="text-red-400">*</span>
              </label>
              <p className="text-zinc-500 text-xs mb-3">
                Add keywords that describe what you&apos;re looking for (e.g. Indie rock, jazz, emerging artists).
              </p>
              <InterestsTagger
                values={profile.interests || []}
                onChange={(vals) => handleChange('interests', vals)}
              />
              {errors.interests && <p className="text-sm text-red-400 mt-1">{errors.interests}</p>}
            </div>
          )}

          {/* ── Step: Expectations ── */}
          {!isLoading && currentStep === 'Expectations' && (
            <>
              <CheckboxGroup
                label="What do you expect from this app?"
                options={EXPECTATIONS_OPTIONS}
                selected={profile.expectationsFromApp || []}
                onChange={(vals) => handleChange('expectationsFromApp', vals)}
                withOther
              />
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  How would you process payments?
                </label>
                <textarea
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500"
                  rows={3}
                  placeholder="e.g. Direct bank transfer, cash on the night, via platform (future)"
                  value={profile.paymentPreferences || ''}
                  onChange={(e) => handleChange('paymentPreferences', e.target.value)}
                />
              </div>
            </>
          )}

          {/* ── Step: Equipment (Venue only) ── */}
          {!isLoading && currentStep === 'Equipment' && isVenue && (
            <>
              <RadioQuestion
                label="Do you provide audio equipment?"
                value={(profile as VenueProfile).providesAudioEquipment}
                onChange={(val) => handleChange('providesAudioEquipment', val)}
              />
              {(profile as VenueProfile).providesAudioEquipment && (
                <textarea
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  rows={2}
                  placeholder="Describe your audio equipment..."
                  value={(profile as VenueProfile).audioEquipmentDescription || ''}
                  onChange={(e) => handleChange('audioEquipmentDescription', e.target.value)}
                />
              )}

              <RadioQuestion
                label="Do you provide a sound engineer?"
                value={(profile as VenueProfile).providesSoundEngineer}
                onChange={(val) => handleChange('providesSoundEngineer', val)}
              />

              <RadioQuestion
                label="Do you provide lighting equipment?"
                value={(profile as VenueProfile).providesLightingEquipment}
                onChange={(val) => handleChange('providesLightingEquipment', val)}
              />
              {(profile as VenueProfile).providesLightingEquipment && (
                <textarea
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  rows={2}
                  placeholder="Describe your lighting equipment..."
                  value={(profile as VenueProfile).lightingEquipmentDescription || ''}
                  onChange={(e) => handleChange('lightingEquipmentDescription', e.target.value)}
                />
              )}

              <RadioQuestion
                label="Do you have a dedicated stage?"
                value={(profile as VenueProfile).hasDedicatedStage}
                onChange={(val) => handleChange('hasDedicatedStage', val)}
              />
              {(profile as VenueProfile).hasDedicatedStage && (
                <textarea
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  rows={2}
                  placeholder="Describe your stage setup..."
                  value={(profile as VenueProfile).stageDescription || ''}
                  onChange={(e) => handleChange('stageDescription', e.target.value)}
                />
              )}

              <Input
                label="Approximate Capacity *"
                type="number"
                value={String((profile as VenueProfile).capacity || '')}
                onChange={(e) => handleChange('capacity', Number(e.target.value || 0))}
                error={errors.capacity}
              />
            </>
          )}

          {/* ── Step: Media ── */}
          {!isLoading && currentStep === 'Media' && (
            <>
              <MediaStep profile={profile} onProfileChange={handleChange} />
              {errors.avatarUrl && <p className="text-sm text-red-400">{errors.avatarUrl}</p>}
              {errors.images && <p className="text-sm text-red-400">{errors.images}</p>}
            </>
          )}

          {/* ── Step: Contact ── */}
          {!isLoading && currentStep === 'Contact' && (
            <>
              <Input
                label="Phone Number *"
                value={(profile as MusicianProfile).contactPhone || ''}
                onChange={(e) => handleChange('contactPhone', e.target.value)}
                error={errors.contactPhone}
                placeholder="+1 234 567 890"
              />
              <Input
                label="Instagram"
                value={(profile as MusicianProfile).socialLinks?.instagram || ''}
                onChange={(e) => handleSocialChange('instagram', e.target.value)}
                placeholder="https://instagram.com/yourprofile"
              />
              <Input
                label="Facebook"
                value={(profile as MusicianProfile).socialLinks?.facebook || ''}
                onChange={(e) => handleSocialChange('facebook', e.target.value)}
                placeholder="https://facebook.com/yourpage"
              />
              <Input
                label="YouTube"
                value={(profile as MusicianProfile).socialLinks?.youtube || ''}
                onChange={(e) => handleSocialChange('youtube', e.target.value)}
                placeholder="https://youtube.com/@yourchannel"
              />
              <Input
                label="Spotify"
                value={(profile as MusicianProfile).socialLinks?.spotify || ''}
                onChange={(e) => handleSocialChange('spotify', e.target.value)}
                placeholder="https://open.spotify.com/artist/..."
              />
            </>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="order-2 w-full sm:order-1 sm:w-auto">
            {stepIndex > 0 && (
              <Button variant="ghost" size="sm" onClick={goBack} className="w-full sm:w-auto">
                Previous
              </Button>
            )}
          </div>
          {updateMutation.error && (
            <p className="order-1 text-sm text-red-400 sm:order-2 sm:flex-1 sm:text-right">
              {(updateMutation.error as Error).message}
            </p>
          )}
          <div className="order-3 flex w-full gap-2 sm:order-3 sm:w-auto">
            {stepIndex < steps.length - 1 && (
              <Button size="sm" onClick={goNext} className="w-full sm:w-auto">
                Next
              </Button>
            )}
            {stepIndex === steps.length - 1 && (
              <Button size="sm" loading={updateMutation.isPending} onClick={handleSave} className="w-full sm:w-auto">
                Save & Verify Email
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

// ── Radio Question Component ──

function RadioQuestion({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-2">{label}</label>
      <div className="flex gap-4">
        <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer border transition-colors ${
          value === true ? 'border-violet-500 bg-violet-500/10 text-violet-300' : 'border-zinc-700 bg-zinc-900 text-zinc-400'
        }`}>
          <input type="radio" checked={value === true} onChange={() => onChange(true)} className="sr-only" />
          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
            value === true ? 'border-violet-500' : 'border-zinc-600'
          }`}>
            {value === true && <span className="w-2 h-2 rounded-full bg-violet-500" />}
          </span>
          Yes
        </label>
        <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer border transition-colors ${
          value === false ? 'border-violet-500 bg-violet-500/10 text-violet-300' : 'border-zinc-700 bg-zinc-900 text-zinc-400'
        }`}>
          <input type="radio" checked={value === false} onChange={() => onChange(false)} className="sr-only" />
          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
            value === false ? 'border-violet-500' : 'border-zinc-600'
          }`}>
            {value === false && <span className="w-2 h-2 rounded-full bg-violet-500" />}
          </span>
          No
        </label>
      </div>
    </div>
  );
}

// ── Interests Tagger ──

function InterestsTagger({
  values,
  onChange,
}: {
  values: string[];
  onChange: (vals: string[]) => void;
}) {
  const [input, setInput] = useState('');

  function addTag() {
    const trimmed = input.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
      setInput('');
    }
  }

  return (
    <div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {values.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-violet-500/20 text-violet-300"
            >
              {tag}
              <button type="button" onClick={() => onChange(values.filter((v) => v !== tag))} className="hover:text-white ml-1">&times;</button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Type an interest and press Add"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          className="flex-1 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
        />
        <Button type="button" variant="secondary" size="sm" onClick={addTag}>Add</Button>
      </div>
    </div>
  );
}
