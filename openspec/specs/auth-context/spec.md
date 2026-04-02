## ADDED Requirements

### Requirement: AuthProvider manages session state
`AuthProvider` SHALL wrap the authenticated app, orchestrate the Slugger SDK handshake, call the bootstrap endpoint, and expose session state to all child components. Session SHALL be stored in React state only — never in `localStorage` or `sessionStorage`.

#### Scenario: Successful auth flow
- **WHEN** Slugger sends a valid `SLUGGER_AUTH` message
- **THEN** AuthProvider calls the bootstrap endpoint, stores the returned user and access token in state, and calls `supabase.auth.setSession()` with the token

#### Scenario: Session not persisted to storage
- **WHEN** a user authenticates successfully
- **THEN** no auth data is written to `localStorage` or `sessionStorage`

#### Scenario: Auth error state
- **WHEN** the bootstrap endpoint returns an error
- **THEN** `useAuth()` returns `{ isAuthenticated: false, error: <message>, isLoading: false }`

### Requirement: useAuth hook provides current session
The `useAuth()` hook SHALL return `{ user: User | null, isLoading: boolean, isAuthenticated: boolean, error: string | null }`. It SHALL throw if called outside of `AuthProvider`.

#### Scenario: Loading state during auth
- **WHEN** the auth flow is in progress
- **THEN** `useAuth()` returns `{ isLoading: true, isAuthenticated: false, user: null }`

#### Scenario: Authenticated state after success
- **WHEN** auth completes successfully
- **THEN** `useAuth()` returns `{ isLoading: false, isAuthenticated: true, user: <User> }` where `user` includes `id`, `role`, `team_id`, `user_name`, and `has_completed_onboarding`

#### Scenario: Hook called outside provider throws
- **WHEN** `useAuth()` is called in a component not wrapped by `AuthProvider`
- **THEN** an error is thrown: "useAuth must be used within AuthProvider"
