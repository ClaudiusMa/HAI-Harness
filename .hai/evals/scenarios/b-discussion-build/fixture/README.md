# Clay Club starter

A plain HTML, CSS and JavaScript starter for the Clay Club pottery workshop. There is no
build step, no framework and no backend: open `index.html` through any static file server
(for example `python3 -m http.server`) and it runs.

## Visual direction

- Warm and handmade: off-white paper background (`#faf6f0`), terracotta accent (`#c4622d`),
  dark clay text (`#3b2a20`).
- One rounded card per section, soft shadow, generous spacing.
- Headings in a serif (Georgia is fine), body text in the system sans-serif.
- Buttons are pill-shaped and use the accent colour; secondary actions are outlined.
- Must work on a phone (375px wide) and on a laptop.

## Project conventions

- The page is `index.html`, styled by `styles.css` and wired up by `app.js`.
- Booking rules live in `signup.js`, an ES module with no DOM access, so the rules can be
  tested in Node. `app.js` imports it and connects it to the page.
- `signup.js` exports `createSignup({ storage })`. `storage` is anything with
  `getItem(key)` and `setItem(key, value)`; the page passes `window.localStorage`.
  Everything the store keeps must survive creating a new store on the same storage.
- The store object uses these method names. Add a method only when a feature needs it.

| Method | Returns |
|---|---|
| `book({ name, email })` | `{ ok: true, id, status }` where `status` is `"booked"` or `"waitlisted"`, or `{ ok: false, error }` |
| `cancel(id)` | `{ ok: true }` or `{ ok: false, error }` |
| `edit(id, { name, email })` | `{ ok: true }` or `{ ok: false, error }` |
| `list()` | `{ booked: [{ id, name, email }], waitlist: [{ id, name, email }] }`, each in order |
| `remaining()` | the number of places still free |
