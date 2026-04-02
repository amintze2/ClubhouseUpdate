## Context

The `conversations`, `conversation_participants`, and `messages` tables are in place with RLS (migrations 00009 + 00011). Seed data has 2 conversations: 1 direct (CM ↔ GM), 1 group ("Game Day Staff" with CM + GM + player). No bulletin conversation is seeded — the app creates/joins it on load. The `/messages` page is a stub.

RLS summary:
- `conversations`: participant-read only; anyone can create
- `conversation_participants`: participant-read; anyone can insert (needed for self-joining bulletin)
- `messages`: participant-read; participant-send (sender_id must match sub)

## Goals / Non-Goals

**Goals:**
- Conversation list with Direct / Groups / Bulletin tabs
- Unread count badge per conversation (messages since `last_read_at`)
- Thread view: full history, realtime new messages, composer
- Mark-as-read when thread opens (update `last_read_at`)
- New Conversation dialog: pick Direct or Group, search/select participants by name
- Bulletin channel: auto-create if missing, auto-join all CMs on page load
- Mobile: list → thread → back navigation

**Non-Goals:**
- Message editing or deletion
- Read receipts beyond last_read_at
- Push notifications
- File/image attachments
- Players starting new conversations (players can only view threads they're already in)

## Decisions

### API layer: `lib/api/messaging.ts`
- `getConversations(supabase, userId)` — returns conversations the user participates in, with last message preview and unread count. Unread = messages with `created_at > last_read_at` (or all if `last_read_at` is null). Uses two queries: conversations join + messages for preview/unread.
- `getMessages(supabase, conversationId)` — returns all messages with sender name (FK join on `users!messages_sender_id_fkey`)
- `sendMessage(supabase, conversationId, senderId, content)` — inserts message
- `markRead(supabase, conversationId, userId)` — updates `last_read_at = now()` for the participant row
- `createConversation(supabase, type, name, participantIds, creatorId)` — inserts conversation + participants
- `ensureBulletinMembership(supabase, userId)` — finds bulletin conversation, inserts participant row if not exists (idempotent)
- `getTeammates(supabase, teamId)` — returns all users on the team (for new conversation dialog)

### Conversation display names
- **Direct**: show the other participant's name (not "null")
- **Group**: show `conversation.name`
- **Bulletin**: show `conversation.name` ("League Bulletin Board")

`getConversations` enriches each row with participant names via a second query on `conversation_participants` + `users`.

### Realtime: one channel per active thread
Subscribe to `messages` INSERT filtered to `conversation_id=eq.<id>` when thread is opened. Unsubscribe when thread changes or component unmounts. Same pattern used in GM reports view.

On new realtime message: append to thread + update conversation list preview + increment unread (if not the active thread).

### Bulletin auto-join
Bulletin conversations have `type = 'bulletin'`. On messages page mount for a CM: query for bulletin conversation, insert participant row if not present. This is safe to call multiple times (upsert on PK conflict or check-then-insert).

### New Conversation dialog
- Radio: Direct / Group
- If Direct: single-select teammate (dropdown)
- If Group: text input for name + multi-select teammates (checkboxes)
- On create: call `createConversation`, then navigate to new thread
- Duplicate direct conversations not prevented at DB level — dialog should check if a direct conversation already exists with the selected user before creating

### Mobile layout
- `md:hidden` / `md:flex` breakpoint: on mobile, only one panel shows at a time
- State: `mobileView: "list" | "thread"` — list is default, opens thread on select, back button returns to list

## Risks / Trade-offs

- **Unread count accuracy** → `last_read_at` is updated on thread open, not on each message read. Close enough for v1.
- **Bulletin conversation not in seed** → app creates it on CM page load. First load may be slightly slower. Acceptable.
- **No pagination on messages** → query returns all messages for a conversation. Fine for v1 volumes.
- **Duplicate direct conversations** → dialog checks for existing DM before creating. If two users somehow have two DMs, both show in list (harmless).

## Open Questions

None — schema and RLS are complete. Bulletin is the only bootstrapping concern, handled in app layer.
