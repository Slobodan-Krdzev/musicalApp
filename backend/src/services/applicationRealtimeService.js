import { Application } from '../models/index.js';

export async function emitDealFinalizationUpdated(io, applicationId, fullyFinalized) {
  if (!io) return;

  const application = await Application.findById(applicationId).lean();
  if (!application) return;

  const payload = {
    applicationId: application._id.toString(),
    status: application.status,
    applicantFinalizedAt: application.applicantFinalizedAt ?? null,
    ownerFinalizedAt: application.ownerFinalizedAt ?? null,
    fullyFinalized: !!fullyFinalized,
  };

  io.to(`user:${application.applicantId}`).emit('deal:finalization_updated', payload);
  io.to(`user:${application.ownerId}`).emit('deal:finalization_updated', payload);
}
