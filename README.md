# Articulator Entitle App

A mobile-centric collector registry web application built with Next.js.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main app page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── Header.tsx
│   ├── Navigation.tsx
│   ├── StatusBar.tsx
│   ├── ScanningModal.tsx
│   └── pages/            # Page components
├── lib/                  # Utilities
│   └── supabase.ts      # Supabase client
└── public/              # Static assets
```

## Features

- Mobile-first responsive design
- Authentication with Supabase
- QR Code, PiCode, and NFC scanning interfaces
- User profile management
- Artwork registry and collection management

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Supabase** - Authentication and backend
- **Lucide React** - Icons

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

Make sure to set the following environment variables in your `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
