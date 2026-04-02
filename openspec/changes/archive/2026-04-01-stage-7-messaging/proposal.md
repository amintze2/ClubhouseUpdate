## Why

Staff members need a way to communicate inside the app without relying on external tools. CMs need to coordinate with GMs, share game-day notes with the broader staff, and message individual team members. A bulletin board gives all CMs a shared league-wide channel.

## What Changes

- Replace `/messages` stub with a live messaging page: conversation list (left) + thread view (right)
- Three conversation types: **direct** (1:1), **group** (named, any members), **bulletin** (league-wide, CMs only)
- Realtime message delivery via Supabase Realtime — new messages appear without refresh
- Unread badge on each conversation showing count of messages since last read
- "New Conversation" button to create direct or group threads
- Bulletin channel: seeded in DB; all CMs are auto-added as participants on the messages page load if not already present
- Mobile layout: conversation list is full-screen by default; tapping a conversation opens the thread full-screen with a back button
- No new migrations — schema, indexes, and RLS are already in place (migrations 00009 + 00011)

## Capabilities

### New Capabilities

- `messaging-conversations`: Conversation list with type tabs, last-message preview, unread badge, new conversation dialog
- `messaging-thread`: Active thread view with scrollable history, sender name/timestamp, composer, realtime updates, mark-as-read on open
- `messaging-bulletin`: Bulletin channel — seeded conversation, CM-only access, auto-join on page load

### Modified Capabilities

<!-- none -->

## Impact

- `app/(app)/messages/page.tsx` — replaced (full messaging UI)
- New: `lib/api/messaging.ts`
- New: `components/messaging/` — conversation list, thread view, message composer, new conversation dialog
- Supabase Realtime used for live message delivery (same pattern as GM reports view)
- `last_read_at` in `conversation_participants` updated whenever a thread is opened
- No schema or migration changes needed
