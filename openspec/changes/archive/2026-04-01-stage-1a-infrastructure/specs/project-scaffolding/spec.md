## ADDED Requirements

### Requirement: Next.js project with App Router
The project SHALL use Next.js 14 with the App Router, TypeScript strict mode, Tailwind CSS, and ESLint. The folder structure SHALL match the layout defined in the rebuild plan: `/app`, `/lib`, `/components`, `/scripts`, `/supabase`.

#### Scenario: Local dev server starts
- **WHEN** a developer runs `npm run dev`
- **THEN** the Next.js dev server starts on port 3000 with no errors and Tailwind utility classes render correctly

#### Scenario: Vercel deployment succeeds
- **WHEN** a developer runs `vercel deploy`
- **THEN** the build completes successfully and the deployed URL is accessible

### Requirement: Supabase client factory
The project SHALL provide a `lib/supabase.ts` module that exports a Supabase client factory. The factory SHALL accept an optional JWT string and inject it as the Authorization header for all requests made with that client instance.

#### Scenario: Client created with JWT
- **WHEN** the factory is called with a JWT string
- **THEN** the returned client sends `Authorization: Bearer <jwt>` on all Supabase requests

#### Scenario: Client created without JWT
- **WHEN** the factory is called with no JWT
- **THEN** the returned client uses the anon key for requests

### Requirement: Shared TypeScript types
The project SHALL provide a `lib/types.ts` module exporting one TypeScript interface per database table. Type names SHALL use PascalCase matching the table name (e.g., `inventory_items` → `InventoryItem`). Enum values SHALL be typed as TypeScript union types or enums matching the Postgres enum definitions.

#### Scenario: Types cover all tables
- **WHEN** a developer imports from `lib/types.ts`
- **THEN** interfaces exist for: Team, User, Game, Task, RecurringTask, RecurringTaskCompletion, InventoryItem, Meal, PlayerPreference, PlayerRestriction, Contact, Conversation, ConversationParticipant, Message, Issue, IssueComment

#### Scenario: Enum types are accurate
- **WHEN** a developer assigns a value to a typed enum field
- **THEN** TypeScript rejects values not in the Postgres enum definition at compile time
