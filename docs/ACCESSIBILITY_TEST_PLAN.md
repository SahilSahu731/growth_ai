# Accessibility acceptance test plan

Target WCAG 2.2 AA. Automated axe checks are a regression guard, not a substitute for the following manual tests.

## Test matrix

Test landing, pricing, login, consent, chat, goals/tasks, settings/privacy, billing, export, account deletion, and administrator login/support views in each configuration:

- Keyboard only at 100%, 200%, and 400% browser zoom, including a 320 CSS-pixel viewport.
- VoiceOver with current Safari on macOS and iOS.
- NVDA with current Firefox or Chrome on Windows.
- TalkBack with current Chrome on Android.
- `prefers-reduced-motion: reduce`, increased text spacing, and high-contrast/forced-color modes where supported.

## Acceptance checklist

- Page title, language, landmarks, headings, and reading order describe the page without visual context.
- Skip navigation works; every control is reachable in a logical order; focus is always visible and never trapped except inside an open modal.
- Tabs support Left/Right, Home/End, selected state, and correct tab/panel relationships.
- Dialogs have an accessible name, receive initial focus, trap focus, close with Escape when dismissible, and return focus to the trigger.
- Status, validation, async success, and destructive-action errors are announced; every error identifies the field and explains recovery.
- Labels, instructions, autocomplete attributes, button names, and icon-only control names are available to assistive technology.
- No text or control is clipped, overlapped, or requires two-dimensional scrolling at 400% zoom except genuine data tables.
- Pointer targets are at least 44×44 CSS pixels where practical and adjacent targets do not overlap.
- Normal text reaches 4.5:1, large text and graphical controls reach 3:1, and information is not conveyed by color alone.
- Rotating content pauses on hover, focus, interaction, and reduced motion and has an explicit pause control.
- Chat updates, proposal approval, retention changes, exports, and deletion outcomes are understandable without vision.

Record browser/AT versions, viewport, tester, date, pass/fail, issue link, and retest result for every route. A critical path fails if a user cannot independently sign in, understand consent, use chat, manage privacy, or contact support.
