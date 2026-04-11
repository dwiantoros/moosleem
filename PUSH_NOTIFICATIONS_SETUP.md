# Push Notification Setup Guide

## Overview
Push notifications work even when the website is closed using Web Push API + Service Worker. The app has 3 layers:

1. **Frontend (Browser)** - Manages subscription and UI
2. **Service Worker** - Handles notifications in background
3. **Backend (Cron Job)** - Sends notifications to all subscribers

## Architecture

### 1. User Subscribes (First Time)
```
User clicks "Enable Notifications"
  ↓
Browser requests permission popup
  ↓
User approves
  ↓
Service Worker generates push subscription
  ↓
Subscription sent to `/api/push/subscribe`
  ↓
Backend stores in Vercel KV (or memory if local)
```

### 2. Prayer Time Notification Sent
```
Cron job triggers `/api/cron/push-prayer` (hourly)
  ↓
Backend fetches prayer times for all locations
  ↓
For matching prayer times, sends push to all subscribers
  ↓
Service Worker receives push event
  ↓
Shows notification (even if website is closed!)
```

### 3. User Clicks Notification
```
User clicks notification
  ↓
Service Worker opens website
  ↓
Website handles the notification action
```

## Environment Variables Required

Add these to `.env.local`:

```env
# Generate VAPID keys with: npx web-push generate-vapid-keys
PUSH_VAPID_PUBLIC_KEY=your-public-key
PUSH_VAPID_PRIVATE_KEY=your-private-key
PUSH_VAPID_SUBJECT=mailto:your-email@example.com

# Security key for cron job
CRON_SECRET=your-secret-key

# Optional: For production persistence use Vercel KV
KV_REST_API_URL=https://your-kv.vercel.sh
KV_REST_API_TOKEN=your-token
```

### Generate VAPID Keys
```bash
npx web-push generate-vapid-keys
```
Copy the output to `.env.local`

## Local Testing

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Enable notifications** in UI (click bell icon)

3. **Test cron job manually:**
   ```bash
   curl http://localhost:3000/api/cron/push-prayer?secret=your-secret-key
   ```

4. **Website can be closed** - notification should still appear in system tray

## Production (Vercel)

1. **Add environment variables to Vercel:**
   - Go to Project Settings → Environment Variables
   - Add `PUSH_VAPID_PUBLIC_KEY`, `PUSH_VAPID_PRIVATE_KEY`, `PUSH_VAPID_SUBJECT`, `CRON_SECRET`

2. **Optional: Setup Vercel KV**
   - Enable Vercel KV for persistent storage
   - Add `KV_REST_API_URL` and `KV_REST_API_TOKEN`
   - Without KV, subscriptions persist only during server runtime

3. **Deploy:**
   ```bash
   vercel --prod
   ```

## Troubleshooting

### Notifications not appearing
- Check browser permissions (Settings → Notifications → muslim-traveler.app)
- Browser DevTools → Application → Service Workers (should be active)
- Check DevTools Console for errors
- Verify VAPID keys are correct

### Service Worker not registering
- Check browser network tab for `/public/sw.js` 404
- Check DevTools → Application → Service Workers status
- Try Force Refresh (Ctrl+Shift+R)

### Cron job not running
- Check Vercel logs: `vercel logs`
- Verify `CRON_SECRET` env variable is set
- Cron currently runs hourly - adjust in `vercel.json` (requires Pro plan for more frequent)

## Files Involved

- **Frontend:** `src/components/AzanReminder.tsx` - Subscribe UI
- **Service Worker:** `public/sw.js` - Handle notifications
- **Backend:** `src/server/push/` - Push logic
- **Cron Route:** `src/app/api/cron/push-prayer/route.ts` - Trigger point
- **Subscriptions:** `src/server/push/store.ts` - Store/retrieve subscriptions

## Browser Support

- ✅ Chrome/Edge 50+
- ✅ Firefox 44+
- ✅ Safari 16+ (macOS, iOS 16.4+)
- ✅ Opera 37+
- ❌ Internet Explorer (not supported)
