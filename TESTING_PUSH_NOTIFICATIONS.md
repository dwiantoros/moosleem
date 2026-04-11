# Testing Push Notifications

## Local Testing

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Open browser:**
   ```
   http://localhost:3000
   ```

3. **Enable notifications:**
   - Click bell icon in navigation
   - Approve browser permission popup

4. **Trigger push notification manually:**
   ```bash
   curl http://localhost:3000/api/cron/push-prayer?secret=your-secret-cron-key-change-this
   ```
   
   Custom secret set in `.env.local`:
   ```env
   CRON_SECRET=your-secret-cron-key-change-this
   ```

5. **Check notification:**
   - Should appear in system notification tray
   - Keep website closed to verify background working

## Vercel Production Testing

### Prerequisites
1. Deploy to Vercel:
   ```bash
   vercel --prod
   ```

2. **Add environment variables in Vercel:**
   - Go to: `https://vercel.com/dwi-antoros-projects/muslim-traveler/settings/environment-variables`
   - Add these 4 variables:
     ```
     PUSH_VAPID_PUBLIC_KEY=BHwj4xAI2p8p5B4P6sGTIU1tppu_1sWGNiJR1Q8cWSyFwzbLSLJVRWixvHUb4eRz98BnHKRC6TC6cCHx4fGObiI
     PUSH_VAPID_PRIVATE_KEY=eodhkPBN_eaApiS2NWSq1OgodSwjDW7FHo4YJ86mtJo
     PUSH_VAPID_SUBJECT=mailto:admin@muslim-traveler.app
     CRON_SECRET=your-preferred-secret-key
     ```

3. **Redeploy after adding env vars:**
   ```bash
   vercel --prod
   ```

### Test Steps
1. **Open production site:**
   ```
   https://muslim-traveler.vercel.app
   ```

2. **Enable notifications + approve permissions**

3. **Trigger cron manually (if CRON_SECRET is set):**
   ```bash
   curl "https://muslim-traveler.vercel.app/api/cron/push-prayer?secret=your-preferred-secret-key"
   ```

4. **Or wait for hourly cron** (runs at \* * * * * → 0 * * * \* after optimization)

5. **Check system notifications** - should appear even with website closed

## Expected Behavior

✅ **Notification appears in system tray**
✅ **Works with website closed**
✅ **Works on mobile browsers (iOS 16.4+, Android Chrome)**
✅ **Clicking notification opens website**

## Troubleshooting

### "Not seeing notifications?"
- Check DevTools → Application → Service Workers (should be "activated and running")
- Check browser permission settings (Settings → Notifications)
- Check browser console for errors
- Try force refresh: `Ctrl+Shift+R`

### "Cron not triggering?"
- Check Vercel logs: `vercel logs`
- Verify `CRON_SECRET` env variable is set
- Check if subscription exists (see next section)

### "No subscriptions found?"
- User must click bell icon and approve notifications first
- Check browser console for subscription errors
- Without Vercel KV, subscriptions only persist during server runtime

## Debug Endpoints

### Check current subscriptions (local only)
```bash
# This endpoint doesn't exist yet - for future reference
# Would help verify subscriptions are being stored
```

### View server logs
```bash
# Vercel
vercel logs

# Local
npm run dev  # Check terminal output
```

## Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome/Edge | 50+ | ✅ Full support |
| Firefox | 44+ | ✅ Full support |
| Safari | 16+ | ✅ macOS/iOS 16.4+ |
| Opera | 37+ | ✅ Full support |
| IE | All | ❌ Not supported |

## Architecture Reference

See [PUSH_NOTIFICATIONS_SETUP.md](./PUSH_NOTIFICATIONS_SETUP.md) for full architecture and setup guide.
