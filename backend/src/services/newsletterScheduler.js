import { runWeeklyNewsletterDigest } from './newsletterService.js';

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly

let intervalId = null;

async function runOnce() {
  const result = await runWeeklyNewsletterDigest();
  if (result.sent > 0) {
    console.log(`[NewsletterScheduler] weekly digest sent=${result.sent} skipped=${result.skipped}`);
  }
}

export function startNewsletterScheduler() {
  console.log(`[NewsletterScheduler] started (every ${CHECK_INTERVAL_MS / 1000}s, weekly digest cadence)`);
  runOnce().catch(console.error);
  intervalId = setInterval(() => {
    runOnce().catch(console.error);
  }, CHECK_INTERVAL_MS);
}

export function stopNewsletterScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
