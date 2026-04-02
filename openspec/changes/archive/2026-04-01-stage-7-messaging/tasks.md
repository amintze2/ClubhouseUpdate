## 1. API Layer

- [x] 1.1 Write `lib/api/messaging.ts` — `getConversations(supabase, userId)` (with last message preview, unread count, participant names), `getMessages(supabase, conversationId)` (with sender name join), `sendMessage(supabase, conversationId, senderId, content)`, `markRead(supabase, conversationId, userId)`, `createConversation(supabase, type, name, participantIds, creatorId)`, `ensureBulletinMembership(supabase, userId)`, `getTeammates(supabase, teamId)`

## 2. Shared Components

- [x] 2.1 Write `components/messaging/conversation-list.tsx` — type tabs (Direct / Groups / Bulletin, Bulletin CM-only); each row shows name, last message preview, timestamp, unread badge; selected row highlighted; `onSelect` prop; "New Conversation" button at top
- [x] 2.2 Write `components/messaging/thread-view.tsx` — scrollable message history (oldest→newest), each message shows sender name + timestamp + content; own messages right-aligned; Realtime subscription on mount; unsubscribe on unmount or conversation change; calls `markRead` on open
- [x] 2.3 Write `components/messaging/message-composer.tsx` — textarea + send button; disabled when empty; submits on Enter (without shift) or send button click; `onSend` prop
- [x] 2.4 Write `components/messaging/new-conversation-dialog.tsx` — radio Direct/Group; Direct: single-select dropdown of teammates; Group: name input + multi-select checkboxes; checks for existing DM before creating; calls `onCreated(conversationId)` on success

## 3. Messages Page

- [x] 3.1 Replace `app/(app)/messages/page.tsx` — fetches conversations on mount; for CMs calls `ensureBulletinMembership`; renders `ConversationList` + `ThreadView` side by side (desktop) or as stack (mobile); manages selected conversation state; mobile: toggles between list and thread views with back button

## 4. End-to-End Verification

- [x] 4.1 As Casey Morgan (CM): open `/messages` — Direct and Groups tabs show seeded conversations with previews and timestamps
- [x] 4.2 CM: open the direct conversation with GM — thread loads with seeded messages; send a new message → appears immediately
- [x] 4.3 CM: open Bulletin tab — bulletin conversation is visible (auto-joined); can post a message
- [x] 4.4 Unread badges: open a conversation with unread messages → badge clears; navigate away and back → badge stays cleared
- [x] 4.5 New Conversation: create a direct DM with a teammate → thread opens; create a group → thread opens
- [x] 4.6 Trying to DM someone already DMed → existing conversation opens, no duplicate created
- [x] 4.7 As GM (Taylor Brooks): Bulletin tab not visible; can see Direct and Groups conversations they're in
- [x] 4.8 As Jordan Lee (player): only sees conversations they participate in (Group "Game Day Staff"); cannot create new conversations
- [x] 4.9 Mobile (375px): conversation list shows full-screen; tapping opens thread full-screen; back button returns to list
