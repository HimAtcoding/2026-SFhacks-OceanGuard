# OceanGuard - AI Ocean Health Intelligence Platform

## Overview
AI-powered drone ocean health monitoring platform. Features real-time dashboard with live data from simulated drone scans, Gemini-powered AI reports, blockchain carbon credit tracking, comprehensive analytics, voice narration, an AI sustainability chatbot (GreenBot), global kelp/trash tracking with world map, and a cleanup dashboard for managing marine debris operations.

## Recent Changes
- 2026-02-15: Added Global Ocean Tracking page with interactive Leaflet world map, 20 city markers, kelp/trash overlays, city rankings
- 2026-02-15: Added Cleanup Dashboard page with operations management, bar/pie charts, cleanup pipeline diagram, data flow architecture diagram
- 2026-02-15: Extended database with cityMonitors, kelpTrashTracks, cleanupOperations tables
- 2026-02-15: Added global seed system with 20 cities and historical data since Feb 14, 2025
- 2026-02-15: Added real-time global tracking engine (updates city kelp/trash every 60s)
- 2026-02-15: Enhanced AI Reports with global city/kelp/trash data context and date range display
- 2026-02-15: Added "Global Kelp & Trash Analysis" report type
- 2026-02-14: Professional redesign - renamed to OceanGuard, removed hackathon-specific pages
- 2026-02-14: Added AI Reports page with Gemini-powered environmental analysis (streaming)
- 2026-02-14: Added Carbon Credits page with blockchain-style transaction ledger
- 2026-02-14: Added Analytics page with radar charts, zone comparison, sensor trends
- 2026-02-14: Added voice narration (Web Speech API) on dashboard
- 2026-02-14: Updated sidebar navigation and landing page for professional appearance
- 2026-02-14: Added real-time scan engine (generates new scans every 30s)
- 2026-02-14: Added AI sustainability chatbot (GreenBot) with OpenAI streaming
- 2026-02-14: Dashboard auto-refreshes every 5s with live indicators

## Architecture
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Shadcn/UI + Recharts + Framer Motion + react-markdown + react-leaflet
- **Backend**: Express.js + Drizzle ORM + PostgreSQL + OpenAI (chatbot) + Gemini (reports)
- **Navigation**: Shadcn sidebar with wouter routing
- **Theme**: Dark/light mode with ThemeProvider
- **Real-time**: Background scan generator (server/realtime.ts) every 30s + global tracking engine every 60s + 5s/15s polling on frontend
- **AI**: OpenAI gpt-4o-mini for chatbot, Gemini 2.0 Flash for report generation (both via Replit AI Integrations)
- **Voice**: Browser SpeechSynthesis API for status narration
- **Mapping**: react-leaflet v4 with OpenStreetMap tiles for global city visualization

## Pages
1. `/` - Landing page with hero, stats, how-it-works, capabilities
2. `/dashboard` - Real-time ocean health dashboard with metrics, charts, scan list, alerts, voice narration
3. `/tracking` - Global Ocean Tracking with interactive world map, 20 city markers, kelp/trash track overlays, city rankings, data flow pipeline
4. `/cleanup` - Cleanup Dashboard with operations management, bar/pie charts, cleanup pipeline diagram, data flow architecture
5. `/reports` - AI-powered environmental reports (Gemini streaming) with date range, kelp/trash analysis
6. `/carbon` - Carbon credit tracking with transaction ledger and accumulation chart
7. `/analytics` - Deep analytics with radar chart, zone comparison, sensor trends
8. `/technology` - Hardware, software, AI/ML, and integrations tech stack

## Key Components
- `client/src/components/chatbot.tsx` - Floating AI chatbot (GreenBot)
- `client/src/components/app-sidebar.tsx` - Navigation sidebar
- `client/src/pages/tracking.tsx` - Global Ocean Tracking with Leaflet map
- `client/src/pages/cleanup.tsx` - Cleanup Dashboard with flow diagrams
- `server/realtime.ts` - Background scan generator + global tracking engine
- `server/globalSeed.ts` - Global city seed data (20 cities) + real-time updater
- `server/chatbot.ts` - AI chat API with sustainability system prompt + live data
- `server/reports.ts` - Gemini-powered report generation with streaming + global data context

## API Routes
- GET /api/scans - All drone scans (ordered by date desc)
- GET /api/alerts - All alerts
- GET /api/live-stats - Aggregated real-time statistics
- GET /api/cities - All city monitors (ordered by score desc)
- GET /api/cities/:id - Single city monitor
- GET /api/tracks - Kelp/trash tracks (optional ?cityId= filter)
- GET /api/cleanup - All cleanup operations
- GET /api/cleanup/city/:cityId - Cleanup operations for a city
- POST /api/cleanup - Create cleanup operation
- PATCH /api/cleanup/:id - Update cleanup operation
- POST /api/chat - Streaming AI chat (body: {messages: [{role, content}]})
- POST /api/reports/generate - Streaming AI report (body: {type, customPrompt?})

## Database Tables
- `users` - User accounts
- `drone_scans` - Drone scan data (location, algae, greenery, water quality, sensors)
- `alerts` - Environmental alerts linked to scans
- `conversations` - Chat conversation sessions
- `messages` - Chat messages linked to conversations
- `city_monitors` - Global city monitoring (20 cities with kelp density, trash level, ratings, scores)
- `kelp_trash_tracks` - Kelp and trash movement tracking points linked to cities
- `cleanup_operations` - Marine debris cleanup operations with status, priority, metrics

## Track Integrations (SF Hacks 2026)
All integrated as functional features without hackathon labels:
- **Gemini API** - AI Reports page (environmental analysis)
- **ElevenLabs** - Voice narration on dashboard (via Web Speech API)
- **Solana** - Carbon credits page (blockchain-style tracking)
- **Snowflake** - Analytics page (data warehouse concept)
- **MongoDB Atlas** - Sensor data streams concept in analytics
- **IBM API** - Data pipeline architecture in technology page
- **.Tech** - Technology stack page
- **Broxi AI** - AI chatbot (GreenBot)
- **JFFVentures** - Environmental impact / sustainability focus throughout

## User Preferences
- Professional, polished design (not "vibe coded")
- No hackathon presentation labels visible to users
- All track integrations presented as natural product features
