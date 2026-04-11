# 📖 Muslim Traveler - Quran Reading & Prayer Times App

A modern, clean web application designed for Muslim travelers. Features Quran reading, prayer times with azan reminders, timezone auto-detection, and halal restaurant recommendations nearby.

## ✨ Features

- **📖 Quran Reader**: Browse and read the complete Quran with smooth navigation
- **⏰ Prayer Times**: Automatically detect your location and display accurate prayer times
- **🔔 Azan Reminders**: Get notifications before each prayer time (with browser notifications)
- **🌍 Timezone Auto-Detection**: Automatically updates prayer times based on your timezone
- **🍽️ Halal Restaurant Finder**: Discover nearby halal restaurants with ratings and contact info
- **🎨 Apple-Style UI**: Clean, minimalist design inspired by Apple's design philosophy
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 14+, React, TypeScript
- **Styling**: Tailwind CSS
- **APIs**:
  - Aladhan API for prayer times
  - Quran.com API for Quran content
  - Browser Geolocation API for location detection
- **State Management**: React Hooks
- **HTTP Client**: Axios

## 📦 Installation

1. Install dependencies
```bash
npm install
```

2. Run the development server
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🚀 Usage

### Getting Started
1. **Grant Location Permission**: The app will request permission to access your location for accurate prayer times
2. **Enable Notifications**: For azan reminders, enable browser notifications when prompted
3. **Select Prayer Reminder**: Use the tab navigation to enable/disable azan reminders

### Reading Quran
1. Click on "📖 Read Quran" tab
2. Search or browse through Surahs (chapters)
3. Click on your desired Surah to view its verses

### Checking Prayer Times
- Main page shows all prayer times for your location
- Next prayer is highlighted with countdown
- Use "Refresh" button to update times

### Finding Halal Restaurants
1. Click on "🍽️ Halal Food" tab
2. View nearby restaurants sorted by distance
3. Click on a restaurant to see details, ratings, and contact info

## 🔧 Configuration

### Server-side Web Push (Adzan when website is closed)

This project now supports server-side Web Push delivery via:

- `POST /api/push/subscribe` (store subscription + location)
- `POST /api/push/unsubscribe`
- `GET /api/push/public-key`
- `GET /api/cron/push-prayer` (triggered every minute by `vercel.json` cron)

Set these environment variables in Vercel (or `.env.local` for local testing):

```bash
PUSH_VAPID_PUBLIC_KEY=...
PUSH_VAPID_PRIVATE_KEY=...
PUSH_VAPID_SUBJECT=mailto:you@example.com
CRON_SECRET=your-random-secret
```

Notes:

- In production, use a Redis/KV integration so subscriptions are durable across serverless invocations.
- If KV credentials are not present, the app falls back to in-memory subscription storage (good for local/dev only).
- Browser notification action `Stop Adzan` is available and will stop adzan audio for active clients.

### API Keys Required

Update the following in `src/utils/prayerTimes.ts`:
- Timezone API Key (for advanced timezone support)
- OpenCage API Key (optional, for reverse geocoding)

### Prayer Method
Method 2 (ISNA) is used by default. To change:
- Modify the `method` parameter in API calls
- Other methods: 1=Ummul Qura, 3=Egypt, 4=Karachi, 5=Tehran, 7=Itiqaf

## 📱 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers

## 🎨 UI/UX Highlights

- **Minimalist Design**: Clean white space and soft shadows
- **Color Palette**: Indigo accent colors with gray neutrals
- **Typography**: Clear hierarchy and readability
- **Interactions**: Smooth transitions and hover states
- **Accessibility**: High contrast ratios and semantic HTML

## 🔐 Privacy

- Geolocation data is processed locally; only coordinates are sent to APIs
- No user data is stored or tracked
- All communications are encrypted (HTTPS)

## 📄 API Documentation

### Prayer Times Endpoint
```
GET /api/prayer-times?latitude=FLOAT&longitude=FLOAT&date=DD-MM-YYYY
```

### Restaurants Endpoint
```
GET /api/restaurants?latitude=FLOAT&longitude=FLOAT&radius=5000
```

## 🐛 Known Issues & Limitations

- Restaurant data is currently mocked (mock API responses)
- Requires HTTPS for geolocation on production
- Some browsers may block notifications on private browsing

## 🚧 Future Enhancements

- [ ] Real halal restaurant API integration
- [ ] Qibla direction indicator with compass
- [ ] Islamic calendar integration
- [ ] Audio Quran recitations
- [ ] Dark mode support
- [ ] Multi-language support (Arabic, Urdu, etc.)
- [ ] Offline mode with cached Quran data
- [ ] Prayer time notifications with sound option

## 📝 License

This project is open source and available under the MIT License.

---

Made with ❤️ for Muslim travelers worldwide
