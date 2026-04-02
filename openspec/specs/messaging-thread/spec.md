## ADDED Requirements

### Requirement: Thread shows full message history
Opening a conversation SHALL display all messages in chronological order (oldest at top, newest at bottom), each with sender name and timestamp.

#### Scenario: Messages load on thread open
- **WHEN** user opens a conversation
- **THEN** all messages are shown oldest-first, newest at the bottom

#### Scenario: Each message shows sender and time
- **WHEN** a message is displayed
- **THEN** the sender's name and timestamp are visible

### Requirement: New messages appear in real time
The active thread SHALL subscribe to new messages via Supabase Realtime. New messages SHALL appear without a page refresh.

#### Scenario: Real-time message delivery
- **WHEN** another participant sends a message while the thread is open
- **THEN** the message appears in the thread without refreshing

#### Scenario: Subscription cleans up on navigation
- **WHEN** the user navigates away from the thread
- **THEN** the Realtime subscription is unsubscribed

### Requirement: Users can send messages
The thread view SHALL include a text input and send button. Submitting a non-empty message SHALL append it to the thread.

#### Scenario: Send a message
- **WHEN** user types a message and submits
- **THEN** the message appears in the thread attributed to the user

#### Scenario: Empty message blocked
- **WHEN** user attempts to send an empty message
- **THEN** the send button is disabled and no request is made

### Requirement: Opening a thread marks it as read
Opening a conversation SHALL update `last_read_at` for the current user in `conversation_participants`, clearing the unread badge.

#### Scenario: Unread badge clears on open
- **WHEN** user opens a conversation with unread messages
- **THEN** the unread badge disappears and `last_read_at` is updated
