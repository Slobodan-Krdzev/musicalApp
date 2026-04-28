import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { APP_URL } from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Cloud-ready upload abstraction. Current: local filesystem (mock).
 * Replace with S3/GCS implementation using same interface.
 */
const UPLOAD_BASE = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');

export const uploadService = {
  /**
   * Save file from buffer. Returns URL path for storage in DB.
   * In production, upload to bucket and return public URL.
   */
  async saveFile(buffer, options = {}) {
    const { folder = 'general', filename: name } = options;
    const dir = path.join(UPLOAD_BASE, folder);
    await fs.mkdir(dir, { recursive: true });
    const filename = name || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const filepath = path.join(dir, filename);
    await fs.writeFile(filepath, buffer);
    return `/uploads/${folder}/${filename}`;
  },

  async deleteFile(relativePath) {
    const filepath = path.join(UPLOAD_BASE, relativePath.replace(/^\/uploads\//, ''));
    try {
      await fs.unlink(filepath);
      return true;
    } catch {
      return false;
    }
  },

  getBaseUrl() {
    return APP_URL;
  },

  /** Full URL for a stored path */
  getPublicUrl(relativePath) {
    if (!relativePath) return null;
    const base = this.getBaseUrl().replace(/\/$/, '');
    return relativePath.startsWith('http') ? relativePath : `${base}${relativePath}`;
  },
};
