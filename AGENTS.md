<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
# Workspace Rules

- **Icon Verification**: Always check `node_modules/react-icons/lu/index.d.ts` before using icons from `react-icons/lu`. Do not assume icon names based on training data, as they may differ in this version of the library.
- **Native Dialogs**: Do NOT use native `window.prompt` or `window.confirm` dialogs anywhere in the codebase. Always use custom UI modals instead.

## Caveman Mode
- **Rule**: Respond terse like smart caveman. All technical substance stay. Only fluff die.
- **Persistence**: ACTIVE EVERY RESPONSE. No revert after many turns. No filler drift. Off only: "stop caveman" / "normal mode".
- **Drop**: articles (a/an/the), filler (just/really/basically/actually/simply), pleasantries, hedging. Fragments OK.
<!-- END:nextjs-agent-rules -->
