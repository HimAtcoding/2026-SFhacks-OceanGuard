# Hack For Greener Tomorrow

## Overview
AI-powered drone ocean health monitoring platform built for SF Hacks 2026. The website showcases the project with a comprehensive dashboard, pitch deck, hackathon tracks, and technology stack details.

## Recent Changes
- 2026-02-14: Initial MVP built with landing page, dashboard, pitch deck, tracks, technology pages
- PostgreSQL database with drone scan and alert data
- Seed data: 7 realistic ocean scan records + 5 environmental alerts

## Architecture
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Shadcn/UI + Recharts + Framer Motion
- **Backend**: Express.js + Drizzle ORM + PostgreSQL
- **Navigation**: Shadcn sidebar with wouter routing
- **Theme**: Dark/light mode with ThemeProvider

## Pages
1. `/` - Landing page with hero, stats, how-it-works, capabilities
2. `/dashboard` - Ocean health dashboard with metrics, charts, scan list, alerts
3. `/pitch` - Full entrepreneurship pitch deck
4. `/tracks` - All SF Hacks 2026 tracks with relevance descriptions
5. `/technology` - Hardware, software, AI/ML stack details

## Database Tables
- `users` - User accounts
- `drone_scans` - Drone scan data (location, algae, greenery, water quality, sensors)
- `alerts` - Environmental alerts linked to scans

## User Preferences
- None recorded yet
