# OceanGuard - AI Ocean Health Intelligence Platform

## Overview
AI-powered drone ocean health monitoring platform. Features real-time dashboard with live data from simulated drone scans, Gemini-powered AI reports, blockchain carbon credit tracking, comprehensive analytics, voice narration, an AI sustainability chatbot (GreenBot), interactive 3D globe for global kelp/trash tracking with movement predictions, and a comprehensive cleanup dashboard with Solana-powered donations and external data integration.

## Recent Changes
- 2026-02-15: Added MongoDB Atlas data mirroring (server/mongodb.ts) - syncs scans, cities, tracks, cleanups, donations, alerts
- 2026-02-15: Built ElevenLabs robocalling system (server/calling.ts) with call buttons per cleanup operation
- 2026-02-15: Added funding goals (fundingGoal, fundingRaised) to cleanup operations with GoFundMe-style progress bars
- 2026-02-15: Donations can link to specific cleanups via cleanupId, auto-updates fundingRaised
- 2026-02-15: Added call_logs database table for tracking verification call status and transcripts
- 2026-02-15: Created Sustainability Education page (/education) with K-12 lesson plans, college modules, live data explorer, API access
- 2026-02-15: Built ExecuTorch on-device AI showcase page (/edge-ai) with live inference simulator and 4 edge models
- 2026-02-15: Replaced 2D Leaflet map with interactive 3D globe (react-globe.gl) on tracking page
- 2026-02-15: Added kelp/trash movement predictions (6h/12h/24h/48h) with animated arcs on globe
- 2026-02-15: Added predictions API endpoint with vector projection forecasting
- 2026-02-15: Enhanced Cleanup Dashboard with urgency rankings (sorted by trash level), weather forecasts, expected biomass
- 2026-02-15: Added Solana devnet donation system with preset supply categories (trash bags, safety equipment, drone maintenance, research fund)
- 2026-02-15: Added external data service with configurable GET URL endpoint
- 2026-02-15: Added weather API endpoint with 7-day forecasts including cleanup suitability ratings
- 2026-02-15: Added donations and appSettings database tables
- 2026-02-15: Added call-to-action section in cleanup dashboard
- 2026-02-15: Added Global Ocean Tracking page with city quality rankings
- 2026-02-15: Extended database with cityMonitors, kelpTrashTracks, cleanupOperations tables
- 2026-02-15: Added global seed system with 20 cities and historical data since Feb 14, 2025
- 2026-02-15: Added real-time global tracking engine (updates city kelp/trash every 60s)
- 2026-02-15: Enhanced AI Reports with global city/kelp/trash data context and date range display
- 2026-02-14: Professional redesign - renamed to OceanGuard, removed hackathon-specific pages
- 2026-02-14: Added AI Reports page with Gemini-powered environmental analysis (streaming)
- 2026-02-14: Added Carbon Credits page with blockchain-style transaction ledger
- 2026-02-14: Added Analytics page with radar charts, zone comparison, sensor trends
- 2026-02-14: Added voice narration (Web Speech API) on dashboard
- 2026-02-14: Added real-time scan engine (generates new scans every 30s)
- 2026-02-14: Added AI sustainability chatbot (GreenBot) with OpenAI streaming

## Architecture
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Shadcn/UI + Recharts + Framer Motion + react-markdown + react-globe.gl + Three.js
- **Backend**: Express.js + Drizzle ORM + PostgreSQL + OpenAI (chatbot) + Gemini (reports)
- **Navigation**: Shadcn sidebar with wouter routing
- **Theme**: Dark/light mode with ThemeProvider
- **Real-time**: Background scan generator (server/realtime.ts) every 30s + global tracking engine every 60s + 5s/15s polling on frontend
- **AI**: OpenAI gpt-4o-mini for chatbot, Gemini 2.0 Flash for report generation (both via Replit AI Integrations)
- **Voice**: Browser SpeechSynthesis API for status narration
- **3D Globe**: react-globe.gl with Three.js for interactive global city visualization with kelp/trash predictions
- **Blockchain**: Solana devnet for cleanup supply donations

## Pages
1. `/` - Landing page with hero, stats, how-it-works, capabilities
2. `/dashboard` - Real-time ocean health dashboard with metrics, charts, scan list, alerts, voice narration
3. `/tracking` - Interactive 3D globe with city markers, kelp/trash overlays, movement predictions, city quality rankings
4. `/cleanup` - Cleanup Dashboard with urgency rankings, weather forecasts, Solana donations, external data, pipeline diagrams
5. `/reports` - AI-powered environmental reports (Gemini streaming) with date range, kelp/trash analysis
6. `/carbon` - Carbon credit tracking with transaction ledger and accumulation chart
7. `/analytics` - Deep analytics with radar chart, zone comparison, sensor trends
8. `/technology` - Hardware, software, AI/ML, and integrations tech stack

## Key Components
- `client/src/components/chatbot.tsx` - Floating AI chatbot (GreenBot)
- `client/src/components/app-sidebar.tsx` - Navigation sidebar
- `client/src/pages/tracking.tsx` - Interactive 3D globe with react-globe.gl, predictions
- `client/src/pages/cleanup.tsx` - Cleanup Dashboard with donations, weather, external data
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
- GET /api/donations - All donations
- POST /api/donations - Create donation
- PATCH /api/donations/:id - Update donation
- GET /api/predictions/:cityId - Kelp/trash movement predictions (6h/12h/24h/48h)
- GET /api/weather/:cityId - 7-day weather & marine forecast
- GET /api/settings/:key - Get app setting
- POST /api/settings - Set app setting
- GET /api/external-data - Fetch external data from configured URL
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
- `donations` - Solana donations with amount, purpose, wallet, tx signature
- `app_settings` - Key-value app configuration (e.g., external data URL)

## Track Integrations (SF Hacks 2026)
All integrated as functional features without hackathon labels:
- **Gemini API** - AI Reports page (environmental analysis)
- **ElevenLabs** - Voice narration on dashboard (via Web Speech API)
- **Solana** - Cleanup donations (devnet, trash bags/supplies/drones/research)
- **Snowflake** - Analytics page (data warehouse concept)
- **MongoDB Atlas** - Sensor data streams concept in analytics
- **IBM API** - Data pipeline architecture in technology page + external data service
- **.Tech** - Technology stack page
- **Broxi AI** - AI chatbot (GreenBot)
- **JFFVentures** - Environmental impact / sustainability focus throughout

## User Preferences
- Professional, polished design (not "vibe coded")
- No hackathon presentation labels visible to users
- All track integrations presented as natural product features
