## ADDED Requirements

### Requirement: Slugger role strings map to app UserRole values
`mapSluggerRole()` SHALL convert Slugger role strings to the `UserRole` enum. Unknown role strings SHALL throw a descriptive error.

Current mappings:
- `"league"` → `"clubhouse_manager"`
- `"gm"` → `"general_manager"`
- `"player"` → `"player"`

Field manager mapping is pending confirmation from Rick White and SHALL be added as a new case when confirmed.

#### Scenario: League role maps to clubhouse manager
- **WHEN** `mapSluggerRole("league")` is called
- **THEN** it returns `"clubhouse_manager"`

#### Scenario: GM role maps to general manager
- **WHEN** `mapSluggerRole("gm")` is called
- **THEN** it returns `"general_manager"`

#### Scenario: Player role maps to player
- **WHEN** `mapSluggerRole("player")` is called
- **THEN** it returns `"player"`

#### Scenario: Unknown role throws
- **WHEN** `mapSluggerRole("unknown_role")` is called
- **THEN** an error is thrown: `"Unknown Slugger role: unknown_role"`
