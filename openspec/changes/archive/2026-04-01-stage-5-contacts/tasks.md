## 1. API Layer

- [x] 1.1 Write `lib/api/contacts.ts` — `getContacts(supabase, teamId)`, `createContact(supabase, data)`, `updateContact(supabase, id, data)`, `deleteContact(supabase, id)`
- [x] 1.2 Add `reorderContacts(supabase, contacts)` to `lib/api/contacts.ts` — takes full ordered array and bulk-updates display_order values

## 2. Contact Components

- [x] 2.1 Write `components/contacts/contact-card.tsx` — displays name, role, phone (tel: link), email (mailto: link); omits missing fields
- [x] 2.2 Write `components/contacts/contact-form-dialog.tsx` — add/edit dialog with fields: name (required), role (required), phone, email, notes; delete button with confirmation on edit
- [x] 2.3 Write `components/contacts/contact-manage-panel.tsx` — list of contacts with up/down reorder buttons, edit button per row, "Add Contact" button at bottom; uses contact-form-dialog

## 3. Contact Bar

- [x] 3.1 Replace `components/layout/contact-bar.tsx` stub — fetch contacts using `useAuth()`; render collapsed strip (label + count) and expanded card grid; show "Edit Contacts" button for CMs; toggle manage panel

## 4. End-to-End Verification

- [x] 4.1 Contact bar visible on checklists, calendar, inventory pages for Casey Morgan (CM)
- [x] 4.2 Expand bar → contacts from seed data appear as cards with phone/email links
- [x] 4.3 CM: add a contact → appears in bar; edit it → changes show; delete it → removed
- [x] 4.4 Reorder: move a contact up/down → order persists after collapse/expand
- [x] 4.5 Switch to Jordan Lee (player) → "Edit Contacts" button not visible
- [x] 4.6 Verify bar usable at 375px (horizontal scroll, cards readable)
