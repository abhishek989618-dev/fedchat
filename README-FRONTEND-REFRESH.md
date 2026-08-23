# FedChat Frontend Refresh

This build keeps the existing API, authentication, Socket.IO, and backend contracts intact while applying a new premium responsive UI layer.

## What changed

- New production-style responsive design system in `client/src/premium-ui.css`.
- Mobile-first bottom navigation for Chats, People, Status, Alerts, and Settings.
- Mobile chat uses a full-screen list -> conversation flow with a persistent composer and safe-area spacing.
- Desktop sidebar and chat layout were refined for a cleaner SaaS product feel.
- Light/dark theme surfaces were harmonized with platform/user theme settings.
- Chat list, message bubbles, composer, buttons, cards, forms, admin surfaces, and authentication were visually unified.
- Added reduced-motion support and stronger focus states.
- Fixed chat hydration so room metadata refreshes cannot overwrite visible message history with an empty `messages` array.
- Fixed realtime conversation events so `conversation:message` also merges the received message into the active chat history.
- Kept the existing website-settings system; primary/accent colors, logo, favicon, theme, title, description, language, and maintenance mode remain applied through the existing settings hook.

## Backend

No backend source was intentionally changed in this refresh.
