# FedChat UI Refresh — 2026

This release introduces a shared premium UI layer across the FedChat client without changing the existing API contracts or realtime messaging flow.

## What was improved

- Shared visual design system: spacing, typography, radii, borders, shadows, focus states and responsive behavior.
- Sidebar: clearer workspace hierarchy, active navigation treatment, connected-user presentation and live presence treatment.
- Top bar: stronger information hierarchy and compact realtime workspace indicator.
- Chat list: denser but calmer rows, clearer unread treatment, improved selected state and empty-state presentation.
- Chat window: cleaner conversation header, message surface, composer, reply/selection bars and info panel.
- Contacts, Groups and Communities: polished cards, forms, lists, buttons and empty/error states.
- Status: improved cards, composer, upload preview and viewer surfaces.
- Notifications: clearer unread/read hierarchy and list containers.
- Plans & Billing: more structured plan cards, payment method and UPI surfaces.
- Settings/Profile/Admin: upgraded cards, forms, tables, navigation and interaction states.
- Authentication: elevated glass-style sign-in surface and stronger form treatment.
- Mobile: improved responsive layout, navigation behavior, page spacing and chat screen transitions.
- Accessibility: stronger keyboard focus styling, navigation `aria-current`, navigation labels and button semantics in the shared shell.

## Validation

All TypeScript/TSX source files were parsed successfully with the TypeScript parser.

A full dependency install/build could not be completed in the sandbox because the package installation step timed out; the uploaded project itself does not include `node_modules`.

## Run locally

```bash
cd client
npm ci
npm run build
npm run dev
```
