# Articulator Entitle App

A React app for an art authentication and collector registry. Scan artwork QR codes to verify provenance and ownership, browse your collection, and manage certificates of authenticity.

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Supabase:**
   - Create a `.env` file in the root directory
   - Add your Supabase credentials:
     ```
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```
   - Get these values from your [Supabase Dashboard](https://app.supabase.com) → Project Settings → API

3. **Run the app:**
   ```bash
   npm run dev
   ```

## Stack

- **React 18** + **TypeScript**
- **Vite**
- **Tailwind CSS**
- **lucide-react** (icons)
- **Supabase** (authentication)

## Features

- **Gallery** – Verification hub, collection stats, recent scans
- **Archive** – Scan history (tab wired, content same as Gallery for now)
- **Guide** – Support (tab wired)
- **Profile** – Settings (tab wired)
- **QR scan** – FAB and card trigger a mock scanning modal with animated frame
