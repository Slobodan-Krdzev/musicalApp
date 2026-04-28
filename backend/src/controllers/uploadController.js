import { uploadService } from '../services/uploadService.js';

/**
 * Upload a single image (avatar or gallery). Expects JSON body: { base64: string, filename?: string }.
 * Returns { url: string } (full URL to the stored file).
 */
export async function uploadImage(req, res, next) {
  try {
    const { base64, filename } = req.body || {};
    if (!base64 || typeof base64 !== 'string') {
      return res.status(400).json({ success: false, error: 'base64 image data required' });
    }
    const match = base64.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ success: false, error: 'Invalid base64 image (expected data:image/...;base64,...)' });
    }
    const ext = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
    const buffer = Buffer.from(match[2], 'base64');
    const folder = 'profiles';
    const name = filename || `img-${Date.now()}.${ext}`;
    const relativePath = await uploadService.saveFile(buffer, { folder, filename: name });
    const url = uploadService.getPublicUrl(relativePath);
    res.json({ success: true, url });
  } catch (err) {
    next(err);
  }
}
