# Clubhouse Rebuild — Stage Plan

Each stage follows a spec → implement cycle.
Stages are ordered by dependency. Stages 2–7 are sequential but independent of each other.
Reference clubhouse-rebuild-plan.md as well for further details about each stage
---

## Stage 1a — Infrastructure
**Modules:** 1 (scaffolding), 2 (database schema)
**Scope:** Next.js project setup, Supabase migrations, RLS policies, games import script, series derivation helper.
**Unlocks:** Everything. Nothing else can be built without this.

## Stage 1b — Auth + Dev Environment + App Shell
**Modules:** 3 (auth), 3b (dev env), 12 (app shell)
**Scope:** Slugger postMessage handshake, bootstrap API route, Supabase JWT signing, local Supabase stack, seed data, dev harness, dev toolbar, sidebar + mobile nav, role-based routing, onboarding gate.
**Unlocks:** All feature stages.

## Stage 2 — Tasks
**Module:** 4
**Scope:** One-off task CRUD, recurring task definitions, recurring task completions (persisted), Daily Checklists view (game-day sectioning + off-day flat list), Recurring Tasks management view, Task Calendar view.
**Depends on:** 1a, 1b

## Stage 3 — Inventory + Contacts
**Modules:** 5, 7
**Scope:** Inventory quick-status checklist, edit dialog, series restock view, shopping list export. Contacts bar (all roles), contact management (CM only).
**Depends on:** 1a, 1b

## Stage 4 — Meal Planning + Player Views
**Modules:** 6, 11
**Scope:** Series-level batch meal planning, per-game editing, dietary restriction aggregation. Player profile (preferred name + dietary restrictions), player meal schedule.
**Depends on:** 1a, 1b

## Stage 5 — Player Reports
**Module:** 9
**Scope:** CM view (table + detail + comments + status), GM view (read-only + flag/unflag + realtime), Player submission form. No field manager routing — `routed_to` is always `'clubhouse_manager'`, invisible to users.
**Depends on:** 1a, 1b

## Stage 6 — Messaging
**Module:** 8
**Scope:** Direct + group + bulletin conversations, realtime message delivery, unread badges, mobile conversation list → thread flow.
**Depends on:** 1a, 1b

## Stage 7 — Onboarding
**Module:** 10
**Scope:** Multi-step questionnaire wizard, Claude API task generation, contacts pre-population, re-run option.
**Depends on:** 1a, 1b, Stage 2 (recurring tasks must exist), Stage 3 (contacts must exist)
**Blocked by:** Claude API key provisioning decision

## Stage 8 — Data Migration + Cutover
**Module:** 13
**Scope:** Migration scripts for all tables (teams → users → games → tasks → inventory → meals → player data → messages → issues), end-to-end validation, Vercel cutover.
**Depends on:** All prior stages complete
**Note:** Look at old schema only at this stage. New schema is designed independently.
