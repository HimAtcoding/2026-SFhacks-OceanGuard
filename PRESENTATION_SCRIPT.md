# OceanGuard - Presentation Script (3-5 Minutes)

---

## PART 1: THE PROBLEM (~40 seconds)

**[Open Food Chain tab]**

Every second breath you take comes from the ocean. Not trees -- the ocean. Phytoplankton produce 50 to 80 percent of Earth's oxygen, and they've declined 40 percent since 1950. Nobody's talking about it.

**[Click through organisms, toggle pessimistic scenario]**

Sharks are down 71 percent. That triggers a chain reaction called a trophic cascade -- predators collapse, the food web destabilizes, and the organisms making our oxygen disappear. Worst case? 70 percent of phytoplankton gone. 90 percent of kelp forests gone. And ocean pollution is accelerating all of it.

So who's actually coordinating a response? Right now -- nobody. That's why we built OceanGuard.

---

## PART 2: THE SOLUTION -- WHAT IS OCEANGUARD (~20 seconds)

**[Navigate to Landing Page]**

OceanGuard is a self-planning AI system for ocean cleanup. It takes real-world pollution data, figures out where to send crews, and handles everything from start to finish -- scouting locations, calling site contacts, posting jobs, onboarding volunteers, collecting donations, and tracking impact. End to end, no human has to organize a thing.

Let me show you how.

---

## PART 3: INTERACTIVE MAP & PREDICTIONS (~45 seconds)

**[Navigate to Tracking tab, click a city like Tokyo or Cape Town]**

We monitor twenty cities around the world. When you click into a city, the 3D globe zooms in and you see five data layers you can toggle independently. Green pulsing rings are kelp forests -- healthy ecosystems acting as carbon sinks. Red rings are trash concentration zones. You can see animated ocean currents showing flow direction, topographic terrain data, and ecosystem markers for things like marine protected areas, coral reefs, and shipping corridors.

**[Show prediction arcs]**

But the critical feature here is the prediction engine. It forecasts where debris and kelp are going to drift over the next 6, 12, 24, and 48 hours using movement vector analysis. So cleanup crews don't go where the trash is now -- they go where it's going to be.

---

## PART 4: SELF-ORGANIZED CLEANUPS (~60 seconds)

**[Navigate to Cleanup tab]**

This is the Cleanup Dashboard. Operations are ranked by urgency based on real trash levels and kelp health data. You can see weather forecasts with cleanup suitability ratings so teams aren't sent out into bad conditions.

**[Expand an operation to show job listings]**

When you expand an operation, the AI generates paid job listings tailored to that specific cleanup -- safety officers, logistics coordinators, marine biologists -- with certifications, hourly rates, and shift details. These aren't templates. They're generated contextually based on the operation's location, scope, and requirements.

**[Show the call button and live transcript]**

And here's where it gets interesting. The platform makes real phone calls. Using Twilio and ElevenLabs for a natural-sounding voice, our AI agent calls site contacts ahead of time. It's not a robotic script -- it's a multi-turn conversation. The AI introduces OceanGuard, explains the proposed cleanup, and then asks follow-up questions about access, permits, timing, site conditions, and safety concerns. It tracks which topics have been covered and determines whether the site is available. You can watch the transcript update live as the call happens.

**[Show Solana donation section]**

For funding, we built a donation system on the Solana blockchain. People can donate directly to specific operations -- trash bags, safety equipment, research funding -- with real on-chain transactions on Solana devnet.

---

## PART 5: SCHOOL SCOREBOARD (~30 seconds)

**[Navigate to Scoreboard tab]**

We also built a way to get students involved. The School Scoreboard is a competition system where schools adopt cities and earn points for real-world actions -- classroom missions, cleanup events, fundraising, and awareness activities. Schools are ranked on a leaderboard you can filter by time period, school type, or city. Each school has a profile showing their points breakdown and action history. The idea is to make ocean conservation competitive and trackable for the next generation.

---

## PART 6: DATA & INTELLIGENCE TABS (~30 seconds)

**[Briefly show each tab]**

On the intelligence side -- the Analytics page gives you radar charts, zone comparisons, and sensor trend data, with Snowflake Cortex running AI-powered analysis on the underlying data.

**[Switch to Reports]**

AI Reports uses Gemini to generate full environmental analysis reports with streaming -- you can select a date range and get a comprehensive breakdown of kelp health, trash trends, and recommended actions.

**[Switch to Carbon Credits]**

And the Carbon Credits page tracks conservation impact with a blockchain-style transaction ledger and accumulation chart.

---

## PART 7: EDGE AI & WRAP-UP (~20 seconds)

**[Navigate to Edge AI tab]**

Finally, we have ExecuTorch -- this is a proof of concept for deploying PyTorch models directly onto edge hardware for real-time scanning in the field. Think coral health classification and debris detection running at under five milliseconds, completely offline. This is where the platform is heading for on-the-ground data collection.

**[Return to Landing Page]**

That's OceanGuard. It sees where the problem is, predicts where it's going, organizes the response, makes the calls, creates the jobs, funds the effort, and gets communities involved. Thanks.
