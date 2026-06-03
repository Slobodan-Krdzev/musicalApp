export type FinalizationStatus = {
  summary: string;
  musicianFinalized: boolean;
  venueFinalized: boolean;
  isFullyFinalized: boolean;
  currentUserFinalized: boolean;
  waitingOnYou: boolean;
};

type FinalizableApplication = {
  status: string;
  entityType: 'EVENT' | 'OFFERING';
  applicantId: string;
  ownerId: string;
  applicantFinalizedAt?: string | null;
  ownerFinalizedAt?: string | null;
};

export function getFinalizationStatus(
  app: FinalizableApplication,
  userId: string | undefined,
): FinalizationStatus | null {
  if (app.status !== 'ACCEPTED' && app.status !== 'FINALIZED') return null;

  const isEvent = app.entityType === 'EVENT';
  const musicianFinalized = !!(isEvent ? app.applicantFinalizedAt : app.ownerFinalizedAt);
  const venueFinalized = !!(isEvent ? app.ownerFinalizedAt : app.applicantFinalizedAt);
  const isFullyFinalized = app.status === 'FINALIZED';

  const isApplicant = !!userId && userId === app.applicantId;
  const isOwner = !!userId && userId === app.ownerId;
  const currentUserFinalized = !!(isApplicant ? app.applicantFinalizedAt : isOwner ? app.ownerFinalizedAt : false);

  let summary: string;
  if (isFullyFinalized) {
    summary = 'Deal finalized by both parties';
  } else if (musicianFinalized && !venueFinalized) {
    summary =
      (isEvent && isApplicant) || (!isEvent && isOwner)
        ? 'You finalized · waiting on venue'
        : 'Musician finalized · your turn to finalize';
  } else if (!musicianFinalized && venueFinalized) {
    summary =
      (isEvent && isOwner) || (!isEvent && isApplicant)
        ? 'You finalized · waiting on musician'
        : 'Venue finalized · your turn to finalize';
  } else {
    summary = 'Awaiting both parties to finalize';
  }

  const waitingOnYou =
    !isFullyFinalized &&
    !currentUserFinalized &&
    (musicianFinalized || venueFinalized);

  return {
    summary,
    musicianFinalized,
    venueFinalized,
    isFullyFinalized,
    currentUserFinalized,
    waitingOnYou,
  };
}
