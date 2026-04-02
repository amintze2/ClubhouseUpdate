## MODIFIED Requirements

### Requirement: Slugger role strings map to app UserRole values
`mapSluggerRole()` SHALL accept both a `role` string and an optional `teamRole` string. When `teamRole` is present it SHALL be the authoritative source for the app role. When `teamRole` is absent or unrecognized, the function SHALL fall back to the `role`-based mapping.

**`teamRole` mappings (primary):**
- `"clubhouse manager"` → `"clubhouse_manager"`
- `"manager"` → `"general_manager"`
- `"player"` → `"player"`

**`role` fallback mappings (used when teamRole absent):**
- `"league"` or `"clubhouse_manager"` → `"clubhouse_manager"`
- `"gm"` or `"general_manager"` → `"general_manager"`
- `"player"` → `"player"`

Unknown combinations (no teamRole match AND no role match) SHALL throw a descriptive error.

#### Scenario: teamRole takes precedence over role
- **WHEN** `mapSluggerRole("league", "manager")` is called
- **THEN** it returns `"general_manager"` (teamRole wins)

#### Scenario: teamRole clubhouse manager maps correctly
- **WHEN** `mapSluggerRole("league", "clubhouse manager")` is called
- **THEN** it returns `"clubhouse_manager"`

#### Scenario: teamRole player maps correctly
- **WHEN** `mapSluggerRole("user", "player")` is called
- **THEN** it returns `"player"`

#### Scenario: Falls back to role when teamRole absent
- **WHEN** `mapSluggerRole("league", undefined)` is called
- **THEN** it returns `"clubhouse_manager"` via role fallback

#### Scenario: Unknown combination throws
- **WHEN** `mapSluggerRole("unknown", undefined)` is called
- **THEN** an error is thrown: `"Unknown Slugger role: unknown"`
