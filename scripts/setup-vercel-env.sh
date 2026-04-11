#!/bin/bash
# Setup Vercel environment variables for push notifications

echo "🚀 Setting up Vercel environment variables for push notifications..."
echo ""

# VAPID keys (yang sudah di-generate)
PUSH_VAPID_PUBLIC_KEY="BHwj4xAI2p8p5B4P6sGTIU1tppu_1sWGNiJR1Q8cWSyFwzbLSLJVRWixvHUb4eRz98BnHKRC6TC6cCHx4fGObiI"
PUSH_VAPID_PRIVATE_KEY="eodhkPBN_eaApiS2NWSq1OgodSwjDW7FHo4YJ86mtJo"
PUSH_VAPID_SUBJECT="mailto:admin@muslim-traveler.app"
CRON_SECRET="muslim-traveler-cron-secret-$(date +%s)"

echo "📝 Environment variables to add:"
echo ""
echo "PUSH_VAPID_PUBLIC_KEY=$PUSH_VAPID_PUBLIC_KEY"
echo "PUSH_VAPID_PRIVATE_KEY=$PUSH_VAPID_PRIVATE_KEY"
echo "PUSH_VAPID_SUBJECT=$PUSH_VAPID_SUBJECT"
echo "CRON_SECRET=$CRON_SECRET"
echo ""
echo "✅ Manual steps:"
echo "1. Go to: https://vercel.com/dwi-antoros-projects/muslim-traveler/settings/environment-variables"
echo "2. Add 4 environment variables above"
echo "3. Run: vercel --prod"
echo ""
echo "🔗 After deployment, test at:"
echo "   https://muslim-traveler.vercel.app"
