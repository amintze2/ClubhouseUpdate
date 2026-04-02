## Context

The `contacts` table exists with columns: `id`, `team_id`, `contact_name`, `role` (as `contact_role`), `phone`, `email`, `notes`, `display_order`, `created_by`, `created_at`. RLS is fully in place: all authenticated users can read contacts for their team; only CMs can insert/update/delete.

The `ContactBar` component is already mounted in `(app)/layout.tsx` and receives no props. It currently shows a placeholder. It needs access to the current user (role + team_id) and the Supabase client.

The `ContactBar` sits inside `(app)/layout.tsx` which is a client component that already has `useAuth()`. The bar itself needs auth context for: fetching contacts (team_id), showing "Edit" button (role check), and creating contacts (created_by).

## Goals / Non-Goals

**Goals:**
- Live contact bar visible to all roles on every page
- Collapsed by default, expands to show contact cards with tap-to-call/email
- CMs can add, edit, delete, and reorder contacts inline
- Contact count shown in collapsed state

**Non-Goals:**
- Drag-and-drop reorder (use up/down arrow buttons instead — simpler on mobile)
- Contact import/export
- Contact categories or groups
- Onboarding pre-population (that's Module 10)

## Decisions

**ContactBar fetches its own data**
Rather than lifting contacts into layout state, `ContactBar` calls `useAuth()` and fetches contacts independently. This keeps the layout thin and the bar self-contained. The bar is already a client component.

**Management via inline panel, not a separate page**
The "Edit Contacts" flow opens a slide-down panel within the contact bar rather than navigating to a new route. Contacts is a small feature — a dedicated page would be overkill and would require adding it to the sidebar.

**Reorder with up/down buttons, not drag-and-drop**
Drag-and-drop is complex to implement correctly on both mobile and desktop. Up/down buttons are straightforward and work everywhere. `display_order` is updated by swapping adjacent values.

**Optimistic updates for all mutations**
Consistent with tasks and inventory — apply UI change immediately, rollback on error with toast.

## Risks / Trade-offs

[ContactBar fetches on every page load] → Acceptable: contacts change rarely. Could add caching later if needed.

[display_order gaps after deletes] → Mitigation: reorder by re-assigning sequential values on every swap/delete rather than storing arbitrary integers.
