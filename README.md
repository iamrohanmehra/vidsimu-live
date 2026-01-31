# VidSimu Live 🎥

A modern, real-time live streaming platform built with React, TypeScript, and
Firebase. Designed for interactive educational sessions with features like live
chat, polls, synchronized video playback, and advanced viewer analytics.

## 🌟 Features

### 🎬 Live Streaming

- **HLS Video Playback** with adaptive quality streaming
- **Dual Video Support**: Screen share + instructor facecam
- **Optimistic Video Sync**: Eliminates loading delays for late joiners
- **Automatic Session End Detection**: Graceful transitions when streams
  conclude

### 💬 Real-Time Interactivity

- **Live Chat**: Real-time messaging with admin moderation
- **Live Polling**: Create and manage polls during sessions
- **Poll Persistence**: Voter choices saved across reloads (visitor ID tracking)
- **Viewer Presence**: Track active viewers in real-time
- **Private Messaging**: Admin-to-viewer direct communication

### 🎵 Enhanced User Experience

- **Synchronized Background Music**: Coordinated countdown music for all users
- **Dark Mode UI**: Premium dark-only aesthetic for consistent viewer experience
- **Countdown Screen**: Engaging pre-session countdown with instructor avatar
- **Connecting Screen**: Smooth loading states with sync progress indicators
- **Session Limit Protection**: Prevents unauthorized multi-tab viewing

### 📊 Analytics & Insights

- **Real-Time Viewer Count**: Live audience metrics
- **Peak Concurrent Viewers**: Session engagement tracking
- **Average Watch Duration**: Viewer retention analytics
- **Message Velocity**: Chat activity metrics
- **Poll Results**: Interactive voting analytics

### 👨‍💼 Admin Dashboard

- **Live Session Management**: Control active sessions
- **Chat Moderation**: Message pinning, deletion, and bulk actions
- **Poll Management**: Create, activate, and close polls
- **Viewer Monitoring**: Real-time viewer list with activity status
- **Offline Analytics**: Export session data (JSON) for offline analysis
- **Analytics Dashboard**: Comprehensive session metrics

## 🛠️ Tech Stack

### Frontend

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **DaisyUI** - UI component library
- **Radix UI** - Accessible component primitives
- **Geist Font** - Premium typography

### Backend & Services

- **Firebase Authentication** - User authentication
- **Cloud Firestore** - Real-time database
- **Firebase Hosting** - Application hosting
- **Cloudflare R2** - Asset storage (music files)

### Video & Media

- **HLS.js** - HTTP Live Streaming playback
- **Custom Sync Engine** - Precise video synchronization

## 📁 Project Structure

```
vidsimu-live/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── StreamPlayer.tsx         # HLS video player
│   │   ├── VideoPlayer.tsx          # Video wrapper with sync
│   │   ├── ChatPanel.tsx            # Live chat interface
│   │   ├── ConnectingScreen.tsx     # Loading state overlay
│   │   ├── CountdownScreen.tsx      # Pre-session countdown
│   │   └── admin/                   # Admin-specific components
│   ├── hooks/               # Custom React hooks
│   │   ├── useStreamSync.ts         # Video synchronization
│   │   ├── useOptimisticVideoSync.ts # Fast initial positioning
│   │   ├── useChat.ts               # Chat functionality
│   │   ├── usePolls.ts              # Polling system
│   │   ├── usePresence.ts           # Viewer tracking
│   │   └── useBackgroundMusic.ts    # Countdown music
│   ├── pages/               # Page components
│   │   ├── StreamPage.tsx           # Viewer live session
│   │   ├── AdminLiveSessionPage.tsx # Admin dashboard
│   │   └── AnalyticsPage.tsx        # Session analytics
│   ├── lib/                 # Utilities and configurations
│   │   ├── firebase.ts              # Firebase setup
│   │   ├── collections.ts           # Firestore references
│   │   ├── api.ts                   # API functions
│   │   └── compute-analytics.ts     # Analytics computation
│   └── types/               # TypeScript type definitions
├── public/                  # Static assets
├── firebase.json            # Firebase configuration
├── firestore.rules          # Firestore security rules
└── package.json             # Dependencies
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Firebase project with Firestore enabled
- Cloudflare R2 bucket (optional, for background music)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd vidsimu-live
```

2. **Install dependencies**

```bash
npm install
# or
bun install
```

3. **Configure environment variables**

```bash
cp .env.example .env
```

Edit `.env` and add your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Optional
VITE_ADMIN_EMAIL=admin@example.com
VITE_R2_MUSIC_URL=https://your-r2-bucket.com/tracks
```

4. **Set up Firestore indexes**

```bash
firebase deploy --only firestore:indexes
```

5. **Start development server**

```bash
npm run dev
# or
bun dev
```

Visit `http://localhost:5173`

## 🔨 Development

### Scripts

```bash
npm run dev       # Start dev server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

### Code Style

- **TypeScript**: Strict mode enabled, avoid `any`
- **Imports**: Use absolute imports (`@/components/...`)
- **Styling**: Tailwind utility classes + DaisyUI components
- **Hooks**: Encapsulate logic in custom hooks
- **State Management**: React hooks + Firebase real-time listeners

## 📐 Key Architecture Patterns

### Video Synchronization

Uses a two-phase optimistic sync approach:

1. **Immediate Estimation**: Calculate position from timestamp (0ms delay)
2. **Background Verification**: Fetch HLS manifest for accuracy
3. **Smooth Transition**: Fade in when sync confidence is high

### Real-Time Data

- Firestore real-time listeners for live updates
- Presence system using Firestore timestamps
- Optimistic UI updates with server reconciliation

### Client-Side Export Engine

- Full session data export to JSON (Chat, Polls, Participants)
- Offline drag-and-drop analysis tool in Admin panel
- Zero-backend dependency for data portability

### Session Gating

- Client-side enforcement of single-tab viewing
- Random client ID generation per session
- Server-side validation via Firestore rules

## 🔑 Key Features Explained

### Optimistic Video Sync

Late-joining users experience zero perceptible delay:

- Estimated position calculated instantly
- Videos load at estimated position
- Background verification ensures accuracy
- Smooth 500ms transition when ready

### Synchronized Background Music

All users hear the same countdown music:

- **Deterministic Seeded Shuffle**: Track order is calculated from session date
- **Precise Timing**: Music starts exactly 10 minutes before session
- **Auto-play Handling**: User gesture requirement with visual hints
- **Position Sync**: Late joiners start at the correct track position

### Live Polling System

Interactive polls during sessions:

- Admin creates and activates polls
- Real-time vote counting
- One vote per user enforcement
- Instant result updates for all viewers

### Session Analytics

Comprehensive metrics computed at session end:

- Total unique viewers
- Peak concurrent viewers (per-minute granularity)
- Average watch duration
- Total messages sent
- Unique chatters
- **Offline Export**: Complete dataset download for external analysis

## 🚢 Deployment

This project can be deployed to either **Firebase Hosting** or **Cloudflare
Pages**.

### Cloudflare Pages (Recommended)

Cloudflare Pages provides global CDN, automatic HTTPS, and unlimited bandwidth.

**Quick Start:**

```bash
npm run build
```

Then connect your repository to Cloudflare Pages with these settings:

- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Framework preset**: Vite

📖 **[Full Cloudflare Deployment Guide](./CLOUDFLARE_DEPLOYMENT.md)**

### Firebase Hosting

1. **Build the application**

```bash
npm run build
```

2. **Deploy to Firebase**

```bash
firebase deploy
```

3. **Deploy specific targets**

```bash
firebase deploy --only hosting        # Deploy app
firebase deploy --only firestore:rules # Deploy security rules
firebase deploy --only firestore:indexes # Deploy indexes
```

### Deployment Features

Both platforms include:

- ✅ SPA routing via `_redirects` file
- ✅ Security headers via `_headers` file
- ✅ Optimized asset caching
- ✅ Automatic HTTPS

## 🔒 Security

### Firestore Rules

- Read access: Authenticated users only
- Write access: Validated per collection
- Chat moderation: Admin role validation
- Poll voting: One vote per user enforcement

### Authentication

- Email verification required for viewers
- Admin access via custom claims
- Protected routes with role checking

## 📊 Collections Schema

### `sessions`

```typescript
{
  id: string;
  title: string;
  time: Timestamp;
  url: string;          // Facecam HLS URL
  screenUrl: string;    // Screen share HLS URL
  duration?: number;    // Video duration in seconds
  connectingDelay: number; // Delay before live (seconds)
  instructor: string;
  instructorImage: string;
}
```

### `messages`

```typescript
{
  id: string;
  streamId: string;
  userId: string;
  displayName: string;
  text: string;
  timestamp: Timestamp;
  isPrivate: boolean;
  isPinned: boolean;
}
```

### `polls`

```typescript
{
  id: string;
  streamId: string;
  question: string;
  options: string[];
  isActive: boolean;
  createdAt: Timestamp;
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary.

## 🙏 Acknowledgments

- Built with React and TypeScript
- Powered by Firebase
- Streaming via HLS.js
- UI components from shadcn/ui and DaisyUI
- Icons by Lucide React

---

**Made with ❤️ for interactive educational experiences**
