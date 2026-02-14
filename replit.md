# Hack For Greener Tomorrow

## Overview
AI-powered drone ocean health monitoring platform built for SF Hacks 2026. The website features a real-time dashboard with live data from simulated drone scans, an AI sustainability chatbot (GreenBot), and comprehensive coverage of all 9 hackathon tracks.

## Recent Changes
- 2026-02-14: Added real-time scan engine (generates new scans every 30s)
- 2026-02-14: Added AI sustainability chatbot (GreenBot) with OpenAI streaming
- 2026-02-14: Dashboard auto-refreshes every 5s with live indicators
- 2026-02-14: Added sensor data analytics bar chart (pH, DO, Turbidity)
- 2026-02-14: Added conversations/messages tables for chat persistence
- 2026-02-14: Initial MVP with landing, dashboard, pitch, tracks, technology pages

## Architecture
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Shadcn/UI + Recharts + Framer Motion + react-markdown
- **Backend**: Express.js + Drizzle ORM + PostgreSQL + OpenAI (via Replit AI Integrations)
- **Navigation**: Shadcn sidebar with wouter routing
- **Theme**: Dark/light mode with ThemeProvider
- **Real-time**: Background scan generator (server/realtime.ts) + 5s polling on dashboard
- **AI**: OpenAI gpt-4o-mini for chatbot with live data context injection

## Pages
1. `/` - Landing page with hero, stats, how-it-works, capabilities
2. `/dashboard` - Real-time ocean health dashboard with metrics, charts, scan list, alerts, sensor analytics
3. `/pitch` - Full entrepreneurship pitch deck
4. `/tracks` - All SF Hacks 2026 tracks with relevance descriptions
5. `/technology` - Hardware, software, AI/ML stack details

## Key Components
- `client/src/components/chatbot.tsx` - Floating AI chatbot (GreenBot)
- `server/realtime.ts` - Background scan generator
- `server/chatbot.ts` - AI chat API with sustainability system prompt + live data

## API Routes
- GET /api/scans - All drone scans (ordered by date desc)
- GET /api/alerts - All alerts
- GET /api/live-stats - Aggregated real-time statistics
- POST /api/chat - Streaming AI chat (body: {messages: [{role, content}]})

## Database Tables
- `users` - User accounts
- `drone_scans` - Drone scan data (location, algae, greenery, water quality, sensors)
- `alerts` - Environmental alerts linked to scans
- `conversations` - Chat conversation sessions
- `messages` - Chat messages linked to conversations

## User Preferences
- None recorded yet
