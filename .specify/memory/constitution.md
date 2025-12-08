<!--
Sync Impact Report:
- Version change: [Initial] → 1.0.0
- Modified principles: N/A (initial constitution)
- Added sections:
  * Frontend Core Principles (7 principles: Component-First, Composition API, State Management, Type Safety, Testing, Quasar First, Mobile-First)
  * Frontend Standards (UX Consistency, Performance, Accessibility, Security, Internationalization)
  * Backend Core Principles (3 principles: Security-First, Data Consistency, Lock-Based Concurrency)
  * Backend Standards (Endpoint patterns, Response formats, Testing requirements)
  * Architecture Constraints (Project structure, routing, API integration)
  * Governance (amendment process, versioning, compliance review)
- Removed sections: N/A (initial version)
- Templates requiring updates:
  ✅ plan-template.md (Constitution Check section will reference these principles)
  ✅ spec-template.md (requirements align with frontend/backend principles)
  ✅ tasks-template.md (task types categorized by frontend/backend principles)
- Follow-up TODOs: None
-->

# messageline Constitution

## Frontend Core Principles

### I. Vue 3 Composition API (NON-NEGOTIABLE)

**MUST** use `<script setup>` exclusively for all new components; **NEVER** use Options API (`export default`) except when maintaining legacy code; composables **MUST** be used for shared logic extraction; components **MUST** be self-contained with clear props/events interfaces.

**Rationale**: Composition API provides superior TypeScript integration, better code organization, and cleaner logic reuse compared to Options API mixins. This is non-negotiable for new code.

### II. Plain JavaScript (NO TypeScript)

**MUST** use plain JavaScript (.js files); **NEVER** use TypeScript syntax, interfaces, type annotations, or .ts extensions; PropTypes or JSDoc **MAY** be used for documentation but **NOT** enforcement.

**Rationale**: Project is JavaScript-first. TypeScript migration is explicitly rejected to maintain simplicity and avoid build complexity.

### III. Functional Component Splitting

Each component **MUST** have single responsibility; components **MUST** be under 250 lines; reusable logic **MUST** be extracted to composables in `src/composables/`; components **MUST NOT** contain business logic beyond presentation concerns.

**Rationale**: Single responsibility ensures testability and reusability. 250-line limit prevents god components. Composables enable logic sharing without duplication.

### IV. Quasar Component Library First (NON-NEGOTIABLE)

**MUST** use Quasar components (QBtn, QInput, QDialog, QTable, etc.) before writing custom components; custom UI components allowed **ONLY** when Quasar lacks the pattern or strict design requirements demand it; **NEVER** install duplicate component libraries (e.g., Vuetify, Element, Bootstrap).

**Rationale**: Quasar provides comprehensive, accessible, responsive components. Consistency across app reduces bundle size and learning curve.

### V. Testing Strategy

**MUST** use Vitest + Vue Test Utils for all component tests; each component **MUST** have its own dedicated test file; tests **MUST** simulate actual user flows with edge cases; tests **MUST** be realistic scenarios, not shallow renders; contract tests **REQUIRED** for all API endpoints; integration tests **REQUIRED** for critical flows (auth, messaging).

**Rationale**: Test investment prioritized by risk/complexity. Realistic user flow tests catch regressions. Contract tests ensure frontend/backend alignment.

### VI. Mobile-First Responsive Design (NON-NEGOTIABLE)

All layouts **MUST** work on mobile (320px+) first, then scale up; **MUST** use Quasar grid system (`q-page`, `row`, `col`); **MUST** use Quasar breakpoints (`$q.screen.lt.md`) for responsive logic; **NEVER** hardcode pixel breakpoints; **MUST** test on real devices or browser dev tools.

**Rationale**: Messaging apps are mobile-first by nature. Quasar's responsive utilities prevent fragmentation and ensure consistent UX across devices.

### VII. State Management Discipline

Pinia stores **MUST** be used for cross-component shared state; component-local state **MUST** use `ref`/`reactive`; **NEVER** use event buses or global objects for state; stores **MUST** be organized by domain (e.g., `useAuthStore`, `useMessageStore`); stores **MUST** be in `src/stores/` directory.

**Rationale**: Centralized, predictable state management prevents prop-drilling nightmares and enables devtools inspection. Domain-based stores align with feature boundaries.

## Frontend Standards

### UX Consistency

- **Design System**: Primary color is `#1976d2` (MUST be used consistently)
- **Quasar Design Language**: Consistent padding, typography, Material Icons
- **UI Consistency**: Look and feel **MUST** be similar across all pages
- **Color Palette**: Follow specified color palette, typography, layout structure
- **Clear Feedback**: Loading indicators (`QSpinner`, `QInnerLoading`) for all async operations; `$q.notify()` for errors/success; clear state management (loading, error, success)
- **Accessibility**: Form labels for all inputs; WCAG AA contrast; keyboard navigation; screen reader support
- **Responsive**: Uses Quasar grid system; mobile-tested on real devices

**Enforcement**: PR review checklist includes UX consistency check against design system.

### Performance Requirements

- **Lazy Loading**: Route components **MUST** be async (`component: () => import(...)`); heavy components **MUST** be dynamically imported
- **Efficient Reactivity**: Use `computed()` for derived state; debounce search inputs; avoid unnecessary re-renders
- **Network & Memory Hygiene**: Cancel requests on component unmount; clean up timers/listeners in `onUnmounted()`
- **Bundle Awareness**: Import only needed Quasar components; evaluate dependency impact before adding libraries
- **Performance Budgets**:
  - Initial bundle size: < 500KB (gzipped)
  - Time to Interactive (TTI): < 3s on 3G
  - Largest Contentful Paint (LCP): < 2.5s

**Enforcement**: Lighthouse CI checks on PRs; bundle analysis on builds.

### Accessibility Requirements

- All interactive elements **MUST** be keyboard navigable
- Color contrast **MUST** meet WCAG AA standards
- Form inputs **MUST** have associated labels
- Critical flows **MUST** work with screen readers
- Use semantic HTML and ARIA attributes where needed

**Rationale**: Messaging is communication; accessibility is non-negotiable for inclusive design.

### Security Practices

- **NEVER** commit API keys, tokens, or credentials
- Use environment variables (`.env` files) for secrets
- **NEVER** use `v-html` except with DOMPurify sanitization
- **ALWAYS** sanitize user-generated content before rendering
- CSP headers **MUST** be configured in production
- Token refresh **MUST** be automatic (handled by API interceptor)

**Rationale**: Messaging apps handle sensitive communication; XSS and credential leaks are critical vulnerabilities.

### Internationalization (i18n)

- **MUST** support English (`i18n/en-US/index.js`) and French (`i18n/fr-FR/index.js`)
- Translation files **MUST** always be in parity (same keys in both files)
- All user-facing text **MUST** use i18n keys, not hardcoded strings
- New features **MUST** add translation keys to both language files simultaneously

**Enforcement**: PR checklist verifies parity between en-US and fr-FR files.

## Backend Core Principles (Google Apps Script)

### I. Security-First Architecture (NON-NEGOTIABLE)

All endpoints **MUST** go through `SecurityInterceptor` validation; public routes **MUST** be explicitly whitelisted in `SecurityInterceptor.publicRoutes`; admin routes **MUST** be explicitly declared in `SecurityInterceptor.adminRoutes`; **EVERY** authenticated endpoint **MUST** return `user` and `token` for automatic token refresh; **ALWAYS** validate required fields using `SecurityInterceptor.validateRequiredFields()`; **ALWAYS** sanitize inputs using `SecurityInterceptor.sanitizeInput()`.

**Rationale**: Security cannot be optional. Centralized validation prevents auth bypass. Token refresh ensures seamless UX while maintaining security.

### II. Data Consistency (NON-NEGOTIABLE)

Every table **MUST** have a `changedBy` field containing the username/email of the user making the change; **MUST** use batch operations (`getValues()`, `setValues()`) for multi-cell reads/writes to ensure atomicity; **NEVER** perform individual cell operations in loops.

**Rationale**: Audit trail is critical for accountability. Batch operations reduce TOCTOU risk and improve performance.

### III. Lock-Based Concurrency Control

**MUST** use `LockService.getPublicLock()` for all critical sections involving read-check-write patterns; **MUST** re-read data inside the locked block before checking and acting (prevents TOCTOU); lock timeout **MUST** be reasonable (< 30 seconds); **MUST** implement audit logging as durability backup.

**Rationale**: Google Sheets lacks native transactions. Locks force serial execution, preventing race conditions, lost updates, and dirty reads.

## Backend Standards

### Endpoint Implementation Pattern

All endpoint methods **MUST** follow this structure:

```javascript
methodName: function(context) {
  const { data, user, token } = context;

  // 1. Validate required fields
  const validation = SecurityInterceptor.validateRequiredFields(data, ['field1', 'field2']);
  if (!validation.valid) {
    return {
      success: false,
      status: 400,
      msgKey: 'error.validation.missingFields',
      message: `Missing required fields: ${validation.missing.join(', ')}`
    };
  }

  // 2. Acquire lock for critical sections
  const lock = LockService.getPublicLock();
  try {
    lock.waitLock(30000);

    // 3. Business logic inside lock
    // Re-read data to ensure current state
    const currentData = /* fetch from sheet */;

    // 4. SUCCESS - MUST include user and token
    return {
      success: true,
      msgKey: 'handler.methodName.success',
      message: 'Operation successful',
      data: { /* response data */ },
      user: user,
      token: token
    };
  } finally {
    lock.releaseLock();
  }
}
```

**Enforcement**: PR review checks for lock usage, token return, and validation.

### Response Formats (NON-NEGOTIABLE)

**Success Response** (status 200):
```json
{
  "status": 200,
  "msgKey": "handler.method.success",
  "message": "Human-readable message",
  "data": {},
  "token": {
    "value": "...",
    "ttl": 1705425600000,
    "username": "user@example.com"
  }
}
```

**Error Response** (status 4xx/5xx):
```json
{
  "status": 400,
  "msgKey": "error.category.specific",
  "message": "Human-readable error",
  "data": {}
}
```

**Error Status Codes**:
- `400`: Validation errors (`error.validation.*`)
- `401`: Unauthorized (`error.auth.*`)
- `403`: Forbidden (`error.forbidden.*`)
- `404`: Not found (`error.entity.notFound`)
- `409`: Conflict (`error.entity.alreadyExists`)
- `500`: Server error (`error.internal`)

**Enforcement**: Response format is enforced by `ResponseHandler` utility.

### Message Key Conventions

| Type       | Pattern                        | Example                        |
|------------|--------------------------------|--------------------------------|
| Success    | `{handler}.{method}.success`   | `auth.login.success`          |
| Validation | `error.validation.{specific}`  | `error.validation.missingFields` |
| Auth       | `error.auth.{specific}`        | `error.auth.invalidCredentials` |
| Token      | `error.token.{specific}`       | `error.token.expired`          |
| Entity     | `error.{entity}.notFound`      | `error.user.notFound`         |

### Testing Requirements

**MUST** write tests for all GAS endpoints; tests **MUST** cover:
- Happy path (valid inputs)
- Validation errors (missing/invalid fields)
- Auth errors (invalid tokens, expired tokens)
- Concurrency scenarios (race conditions, locks)
- Edge cases (boundary values, empty data)

**Rationale**: Backend bugs cause data corruption. Comprehensive tests prevent regressions.

## Architecture Constraints

### Frontend Project Structure

```
src/
├── components/      # Reusable Vue components (max 250 lines each)
├── pages/           # Route-level page components
├── layouts/         # App layout wrappers
├── stores/          # Pinia stores (domain-organized: useAuthStore, useMessageStore)
├── composables/     # Shared composition functions (extracted logic)
├── services/        # API clients (api.js with endpoints)
├── router/          # Vue Router configuration
├── boot/            # Quasar boot files (plugins, axios setup)
└── i18n/            # Internationalization
    ├── en-US/       # English translations
    └── fr-FR/       # French translations (MUST match en-US keys)
```

**Enforcement**: New files MUST follow this structure. Migration of misplaced files required during refactoring sprints.

### Backend Project Structure (GAS)

```
gas/
├── Main.gs                     # Entry point (doPost/doGet)
├── handlers/
│   ├── AuthHandler.gs          # Authentication endpoints
│   └── [Feature]Handler.gs    # Feature-specific endpoints
├── security/
│   ├── SecurityInterceptor.gs  # Request validation & auth
│   └── TokenManager.gs         # Token operations
├── services/
│   ├── UserService.gs          # Database operations (users)
│   └── [Feature]Service.gs    # Feature-specific DB operations
└── utils/
    ├── Router.gs               # Routes actions to handlers
    ├── ResponseHandler.gs      # Standardizes responses
    ├── DateUtil.gs             # Date/time utilities
    └── PasswordUtil.gs         # Password hashing, OTP generation
```

**Enforcement**: New handlers MUST register in `Router.gs`. New security rules MUST update `SecurityInterceptor.gs`.

### API Integration Pattern

Frontend API calls **MUST** follow this pattern in `src/services/api.js`:

```javascript
export const featureApi = {
  methodName: (param1, param2) => api.post('handler.methodName', { param1, param2 })
};
```

Action format: `'handler.method'` (e.g., `'auth.login'`, `'profile.getProfile'`)

**Rationale**: Centralized API client ensures consistent error handling, auth token injection, and easier mocking for tests.

### Routing Constraints

Routes **MUST** be defined in `src/router/routes.js`; lazy loading via dynamic imports **MUST** be used for all page components; route guards for authentication **MUST** be centralized in router configuration.

**Example**:
```javascript
{
  path: '/dashboard',
  component: () => import('pages/DashboardPage.vue'),
  meta: { requiresAuth: true }
}
```

**Rationale**: Code splitting via lazy loading improves initial load time. Centralized guards prevent scattered auth checks.

## Development Standards

### Code Quality Gates

- **Linting**: ESLint **MUST** pass (`npm run lint`) before commits
- **Formatting**: Prettier **MUST** be applied (`npm run format`)
- **Build**: `npm run build` **MUST** succeed without warnings
- **Tests**: `npm run test` **MUST** pass (if tests exist)

### Component Best Practices

- Components **MUST** be under 250 lines
- Reusable logic **MUST** be extracted to composables
- Component names **MUST** be PascalCase
- Event names **MUST** be kebab-case
- Props **MUST** have defaults where applicable

### Clean & Readable Code

- Use descriptive variable/function names
- Extract magic numbers/strings to constants
- Avoid deeply nested logic (max 3 levels)
- Add comments for non-obvious business logic
- Follow single responsibility principle

## Governance

### Amendment Process

1. Propose amendment via issue/discussion with rationale
2. Document impact on existing templates/artifacts (plan, spec, tasks)
3. Require approval from project maintainer
4. Update constitution version per semantic versioning
5. Propagate changes to all dependent templates
6. Update PR checklist templates if new compliance checks added

### Versioning Policy

- **MAJOR**: Principle removal, architecture shift (e.g., Vue 2→3), non-negotiable rule changes, breaking changes
- **MINOR**: New principle addition, expanded guidance, new constraints, new compliance requirements
- **PATCH**: Clarifications, typo fixes, example improvements, wording refinements

### Compliance Review

- All PRs **MUST** include compliance checklist:
  - [ ] Vue 3 Composition API: Feature uses `<script setup>` exclusively
  - [ ] Plain JavaScript: No TypeScript syntax
  - [ ] Functional Component Splitting: Components under 250 lines
  - [ ] Quasar Integration: Uses Quasar components consistently
  - [ ] Clean & Readable Code: Logic extracted to composables
  - [ ] Testing: Component isolation, Vitest tests, realistic scenarios
  - [ ] UX Consistency: Design system, Quasar design language, clear feedback
  - [ ] Performance: Lazy loading, efficient reactivity, network hygiene
  - [ ] Accessibility: Form labels, WCAG AA contrast, keyboard navigation
  - [ ] Internationalization: en-US and fr-FR files in parity
  - [ ] Backend Security: Endpoints through SecurityInterceptor, token refresh
  - [ ] Data Consistency: `changedBy` field, batch operations
  - [ ] Lock-Based Concurrency: Locks for critical sections
- Complexity violations (e.g., new state library, custom UI framework) **MUST** justify in PR description
- Constitution review required quarterly or when 3+ violations occur

### Conflict Resolution

When feature requirements conflict with constitution:

1. Attempt to satisfy both (preferred)
2. Document trade-off analysis in `plan.md` Complexity Tracking table
3. Seek user/maintainer clarification
4. If violation approved, note in PR and commit message with rationale

### Frontend Requirements Compliance Checklist

**Core Principles Compliance**:
- [ ] Vue 3 Composition API: Feature uses `<script setup>` exclusively, no Options API or `export default`
- [ ] Plain JavaScript: No TypeScript syntax, interfaces, or type annotations
- [ ] Functional Component Splitting: Each distinct feature is its own component with single responsibility
- [ ] Quasar Integration: Uses Quasar components and composables consistently
- [ ] Clean & Readable Code: Components under 250 lines, reusable logic extracted to composables

**Testing Standards Compliance**:
- [ ] Component Isolation: Each component has its own dedicated test file
- [ ] Vitest + Vue Test Utils: Tests written in plain JavaScript
- [ ] Realistic Test Scenarios: Tests simulate actual user flows with edge cases

**UX Consistency Compliance**:
- [ ] Design System: Follows color palette, typography, and layout structure specifications
- [ ] Quasar Design Language: Consistent padding, typography, Material Icons
- [ ] Clear Feedback & States: Loading indicators, `$q.notify()` for errors, success confirmations
- [ ] Accessibility: Form labels, WCAG AA contrast, keyboard navigation
- [ ] Responsive: Uses Quasar grid system, mobile-tested

**Performance Requirements Compliance**:
- [ ] Lazy Loading: Route components are async, heavy components dynamically imported
- [ ] Efficient Reactivity: Uses `computed()` for derived state, debounced search inputs
- [ ] Network & Memory Hygiene: Cancels requests on unmount, cleans up timers/listeners
- [ ] Bundle Awareness: Imports only needed Quasar components, evaluates dependency impact

**Additional Requirements Compliance**:
- [ ] Mobile-First Design: Designed for mobile viewports first
- [ ] Internationalization: Supports English and French via i18n keys
- [ ] i18n Parity: Files in `i18n/en-US/index.js` and `i18n/fr-FR/index.js` are in parity with latest translation keys
- [ ] Progress Indicators: Displays indicators for all async operations
- [ ] UI Consistency: Consistency across all pages, similar look and feel
- [ ] Primary Color: Uses `#1976d2` consistently
- [ ] Response Formats: Handles success/error responses per documented formats

**Backend Requirements Compliance**:
- [ ] Security-First: All endpoints through `SecurityInterceptor`, token refresh included
- [ ] Data Consistency: `changedBy` field present, batch operations used
- [ ] Lock-Based Concurrency: `LockService` used for critical sections, TOCTOU mitigation
- [ ] Response Formats: Follows documented success/error response structure
- [ ] Message Key Conventions: Uses standardized message key patterns
- [ ] Testing: Tests written for all endpoints covering happy path, validation, auth, concurrency, edge cases

**Version**: 1.0.0 | **Ratified**: 2025-11-25 | **Last Amended**: 2025-11-25
