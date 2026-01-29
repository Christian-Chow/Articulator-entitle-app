# Articulator Entitle App

A mobile-centric collector registry web application built with Next.js, featuring PiCode encoding/decoding capabilities.

## Getting Started

### Prerequisites

- Node.js 20+ 
- npm or yarn
- Docker (for production deployment)

### Installation

1. Install dependencies:
```bash
npm install
cd backend && npm install
```

2. Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

3. Build the C++ decoder/encoder binaries (if not using Docker):
```bash
cd backend/cpp_src
make clean && make
```

4. Start the backend server (in a separate terminal):
```bash
cd backend
npm start
# or for development with auto-reload:
npm run dev
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Main app page
│   ├── globals.css              # Global styles
│   └── artworks/                # Artwork pages
│       └── [artworkId]/
│           ├── page.tsx         # Artwork detail page
│           └── menu/
│               └── page.tsx    # Artwork menu page
├── backend/                      # Backend server
│   ├── server.js                # Express server
│   ├── cpp_src/                 # C++ source code
│   │   ├── decoder/            # PiCode decoder
│   │   ├── encoder/            # PiCode encoder
│   │   └── Makefile            # Build configuration
│   ├── decoder                  # Compiled decoder binary
│   └── encoder                  # Compiled encoder binary
├── components/                   # React components
│   ├── Header.tsx               # App header
│   ├── Navigation.tsx           # Bottom navigation
│   ├── ScanningModal.tsx        # Camera scanning modal
│   └── pages/                   # Page components
│       ├── LoginPage.tsx
│       ├── ForgotPasswordPage.tsx
│       ├── PortalPage.tsx
│       ├── ProfilePage.tsx
│       ├── MenuOption.tsx
│       └── PlaceholderPage.tsx
├── lib/                         # Utilities
│   ├── supabase.ts             # Supabase client
│   ├── api.ts                  # API functions
│   ├── urls.ts                 # URL utilities
│   └── utils.ts                # Helper functions
├── public/                      # Static assets
│   └── logo.png                # App logo
├── Dockerfile                   # Docker configuration
└── DEBUGGING.md                # Debugging guide
```

## Features

- **Mobile-first responsive design** - Optimized for mobile devices
- **Authentication** - Login, signup, and password reset with Supabase
- **PiCode Support** - Encode and decode PiCode images
- **QR Code Scanning** - Scan QR codes for artwork identification
- **NFC Support** - NFC tag interaction interface
- **Image Upload** - Upload images for PiCode decoding
- **User Profile Management** - Profile settings and account management
- **Artwork Registry** - View and manage artwork collections
- **Camera Integration** - Real-time camera scanning for codes

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

### Backend
- **Node.js/Express** - Backend API server
- **C++** - PiCode encoder/decoder binaries
- **CImg Library** - Image processing
- **ImageMagick** - Image format support

### Services
- **Supabase** - Authentication and database

## Scripts

### Frontend
- `npm run dev` - Start Next.js development server (port 3000)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Backend
- `cd backend && npm start` - Start backend server (port 3001)
- `cd backend && npm run dev` - Start backend with auto-reload
- `cd backend/cpp_src && make` - Build C++ binaries

## Environment Variables

Make sure to set the following environment variables in your `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `NEXT_PUBLIC_BACKEND_URL` - Backend API URL (default: `http://localhost:3001`)

## Backend API

The backend server runs on port 3001 and provides the following endpoints:

### Endpoints
- `POST /api/encode` - Encode a message into a PiCode image
- `POST /api/decode` - Decode a PiCode from an uploaded image
- `GET /health` - Health check endpoint
- `GET /debug/decoder` - Check decoder binary status
- `POST /debug/test-decoder` - Test decoder with an uploaded image

### Requirements
- ImageMagick must be installed for image format support
- Decoder/encoder binaries must be executable
- Uploads directory must be writable

See [DEBUGGING.md](./DEBUGGING.md) for detailed debugging information.

## Docker Deployment

The application includes a multi-stage Dockerfile for production deployment:

```bash
docker build -t articulator-app .
docker run -p 8080:8080 -p 3001:3001 articulator-app
```

The Docker image includes:
- Frontend Next.js application
- Backend Express server
- Compiled C++ binaries
- Required runtime dependencies (ImageMagick, libpng, libjpeg-turbo)

## Development Notes

- The backend server must be running for PiCode encoding/decoding to work
- Image uploads are temporarily stored in `backend/uploads/`
- C++ binaries are compiled during Docker build or manually with `make`
- The decoder requires ImageMagick for proper image format recognition
