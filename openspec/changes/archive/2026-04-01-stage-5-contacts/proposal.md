## Why

Every page needs a persistent "Key Contacts" bar so any staff member can quickly reach key people. The contact bar shell already exists but is empty. This stage wires it to real data and gives clubhouse managers the tools to manage contacts.

## What Changes

- Replace the `ContactBar` stub with a live component: collapsed "Key Contacts N" strip, expanded horizontal-scroll card grid showing name, role, phone (tap-to-call), email (tap-to-email)
- Add "Edit Contacts" button visible only to clubhouse managers, opening a management drawer/dialog
- Contact management: add, edit, delete contacts with fields name (required), role (required), phone, email, notes
- Manual reorder via up/down buttons (sets `display_order`) — drag-and-drop deferred for simplicity on mobile
- New API module `lib/api/contacts.ts`
- Contacts scoped to team via RLS (already in place)

## Capabilities

### New Capabilities

- `contact-bar`: Persistent collapsible bar visible to all roles showing key contacts with tap-to-call/email
- `contact-management`: CM-only add/edit/delete/reorder contacts

### Modified Capabilities

<!-- none -->

## Impact

- `components/layout/contact-bar.tsx` — replace stub with live implementation
- `lib/api/contacts.ts` — new API module
- `components/contacts/` — new component folder
- Reads/writes `contacts` table (RLS already team-scoped in `00011_rls_policies.sql`)
- No schema changes required
