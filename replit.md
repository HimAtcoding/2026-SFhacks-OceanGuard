# OceanGuard - AI Ocean Health Intelligence Platform

## Overview
AI-powered drone ocean health monitoring platform. Features real-time dashboard with live data from simulated drone scans, Gemini-powered AI reports, blockchain carbon credit tracking, comprehensive analytics, voice narration, an AI sustainability chatbot (GreenBot), interactive 3D globe for global kelp/trash tracking with movement predictions, and a comprehensive cleanup dashboard with Solana-powered donations and external data integration.

## Recent Changes
- 2026-02-15: Enhanced 3D globe with topographic texture switching (grayscale heightmap + material tinting), animated ocean current flows (14 pathsData with dash animation using hemisphere-based Coriolis patterns), pulsing kelp forest ring overlays (ringsData), ecosystem info markers (labelsData: Marine Protected Area, Coral Reef, Shipping Corridor, Research Station), toggleable layer controls, contextual info panels with educational content, seeded RNG for deterministic generation
- 2026-02-15: Rewrote robocaller as initial outreach call (not verification): greeting explains who OceanGuard is, what cleanup is proposed, and when; AI asks follow-up questions about access, permits, timing, conditions, safety before concluding
- 2026-02-15: Added topic tracking (access/permits/timing/conditions/safety) with minimum 3 turns and 2 topics required before AI can conclude a call outcome
- 2026-02-15: Replaced conversation outcome analysis with AI-powered sentiment analysis (OpenAI) - fixes bug where positive responses like "pretty good" were misclassified as negative
- 2026-02-15: Upgraded conversation response generation from Snowflake Cortex to OpenAI (BroxiAI) as primary with Snowflake as fallback
- 2026-02-15: Added AI-generated job listings (POST /api/cleanup-jobs/generate/:cleanupId) using OpenAI to create contextual positions per cleanup operation, cached in DB
- 2026-02-15: Frontend auto-triggers AI job generation when expanding a cleanup operation with no existing jobs, shows "AI is generating..." loading state
- 2026-02-15: Redesigned Food Chain page as interactive 2D underwater scene with canvas-animated ocean, moving organism silhouettes, depth zones, bubbles, kelp forests, climate-reactive backgrounds, and side panel info
- 2026-02-15: Added cleanup job listings with expand/collapse per operation, role-type icons/colors, certifications, hourly rates, shift hours, and apply forms
- 2026-02-15: Added cleanup_jobs and job_applications schema tables
- 2026-02-15: Fixed Twilio voice consistency: changed fallback <Say> voice from Polly.Joanna to Polly.Amy (British) to match ElevenLabs
- 2026-02-15: Enhanced Food Chain page with kelp/algae carbon sink section, interactive climate scenario toggles (RCP 2.6/current/RCP 8.5), SVG flowchart arrows between organisms
- 2026-02-15: Fixed Twilio/ElevenLabs TTS bug: added <Say> voice fallback when ElevenLabs audio buffer is empty or unavailable, preventing "internal server error" playback
- 2026-02-15: Replaced Education Hub with School Scoreboard (/scoreboard): leaderboard with filters, school profiles, admin action review, 8 seeded schools, 25 actions
- 2026-02-15: Added schools + school_actions database tables with points system (Classroom Mission 50pts, Cleanup Event 200+2/kg, Donation 1$/pt, Awareness 75pts)
- 2026-02-15: Added interactive Ocean Food Chain page (/food-chain) with clickable organisms, trophic cascade visualization, climate impact explanations, and oxygen production connection
- 2026-02-15: Added Snowflake Cortex AI integration (server/snowflake.ts) with LLM-powered ocean data analysis on Analytics page
- 2026-02-15: Rewrote call verification system: Snowflake Cortex AI generates conversational responses, ElevenLabs provides TTS, Twilio handles calls + speech recognition via webhooks
- 2026-02-15: Added Twilio webhook endpoints (/api/twilio/answer, /api/twilio/process-speech, /api/twilio/status) with signature validation
- 2026-02-15: Added conversation state management with 6-turn limit, outcome detection (accepted/declined/inconclusive), audio caching
- 2026-02-15: Added MongoDB Atlas data mirroring (server/mongodb.ts) - syncs scans, cities, tracks, cleanups, donations, alerts
- 2026-02-15: Built verification calling system (server/calling.ts) with call buttons per cleanup operation
- 2026-02-15: Added funding goals (fundingGoal, fundingRaised) to cleanup operations with GoFundMe-style progress bars
- 2026-02-15: Donations can link to specific cleanups via cleanupId, auto-updates fundingRaised
- 2026-02-15: Added call_logs database table for tracking verification call status and transcripts
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
8. `/food-chain` - Interactive ocean food chain with clickable organisms, trophic cascade, climate impact, carbon sink, climate scenarios
9. `/technology` - Hardware, software, AI/ML, and integrations tech stack
10. `/scoreboard` - School Scoreboard with leaderboard, filters, school profiles, admin review
11. `/scoreboard/admin` - Admin review interface for pending school actions

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
- GET /api/snowflake/status - Check if Snowflake Cortex is configured
- POST /api/snowflake/analyze - LLM analysis of ocean data (body: {analysisType: overview|predictions|comparison})
- POST /api/snowflake/query - Custom LLM query against ocean data (body: {prompt})
- GET /api/call-logs/:id/transcript-stream - SSE stream for live call transcripts
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
