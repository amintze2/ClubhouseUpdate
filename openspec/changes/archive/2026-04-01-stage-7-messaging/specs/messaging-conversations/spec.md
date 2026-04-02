## ADDED Requirements

### Requirement: Users see only their own conversations
The conversation list SHALL show only conversations the current user is a participant in, ordered by most recent message.

#### Scenario: List shows participant conversations only
- **WHEN** a user opens `/messages`
- **THEN** only conversations they are a participant in are shown

#### Scenario: Ordered by most recent activity
- **WHEN** a new message is sent in a conversation
- **THEN** that conversation moves to the top of the list

### Requirement: Conversation list is filterable by type
The list SHALL have three tabs: Direct, Groups, Bulletin. The active tab filters the list. Direct shows 1:1 conversations; Groups shows named group threads; Bulletin shows bulletin conversations.

#### Scenario: Direct tab shows only direct conversations
- **WHEN** user selects the Direct tab
- **THEN** only conversations with `type = 'direct'` are shown

#### Scenario: Groups tab shows only group conversations
- **WHEN** user selects the Groups tab
- **THEN** only conversations with `type = 'group'` are shown

### Requirement: Each conversation row shows a preview and unread badge
Each row SHALL display the conversation name (or other participant's name for DMs), the last message content (truncated), the timestamp of the last message, and an unread count badge if there are unread messages.

#### Scenario: Direct conversation shows other participant's name
- **WHEN** a direct conversation is shown in the list
- **THEN** the row displays the name of the other participant, not "null"

#### Scenario: Unread badge shows count of unread messages
- **WHEN** there are messages in a conversation sent after the user's `last_read_at`
- **THEN** a badge showing the count is visible on the row

#### Scenario: No badge when all messages are read
- **WHEN** the user has read all messages in a conversation
- **THEN** no unread badge is shown

### Requirement: Users can create new direct or group conversations
A "New Conversation" button SHALL open a dialog. The user selects Direct (pick one teammate) or Group (enter a name + pick multiple teammates). Submitting creates the conversation and opens the thread.

#### Scenario: Create direct conversation
- **WHEN** user selects Direct, picks a teammate, and submits
- **THEN** a new direct conversation is created and the thread opens

#### Scenario: Create group conversation
- **WHEN** user enters a group name, selects teammates, and submits
- **THEN** a new group conversation is created and the thread opens

#### Scenario: Existing direct conversation reused
- **WHEN** user tries to create a direct conversation with someone they already have a DM with
- **THEN** the existing conversation is opened instead of creating a duplicate
