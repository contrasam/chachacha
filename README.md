# chachacha 💌

Make tiny, silly, chibi-cute pages for your partner and share them with a link.

> "Am I a cutie patootie?" — **Yes** grows bigger every time they try to click **No**… and **No** runs away.

## How it works

1. **Build**: pick a template (or start blank), add the recipient's name, a mascot, a theme, and blocks:
   - 🙈 **Yes / dodging No**: the No button dodges the cursor (or finger) and begs "are you sure?", while Yes keeps growing
   - ⭐ **Star rating**: 3, 5 or 10 stars
   - ✏️ **Free answer**: a text box
   - 💌 **Sweet note**: just a message
2. **Share**: copy the link and send it to your person.
3. **They play**: they go through it one card at a time, with confetti hearts.
4. **They reply**: at the end they get a reply link to send back, which shows you their answers (including how many times they tried to click No 😤).

There is no backend: the whole page is encoded in the link's `#hash`, so nothing is uploaded or stored on a server and the site can be hosted anywhere as static files. Drafts are saved in your browser's localStorage.

## Run locally

No build step. Serve the folder with any static server:

```sh
npm start          # serves on http://localhost:5173
npm test           # codec/sanitizer unit tests (Node 20+)
```

Opening `index.html` straight from disk won't work, because browsers block ES modules on `file://` URLs.

## Deploy

Push to GitHub Pages, Netlify or Vercel as a plain static site. No configuration is needed.

## Project layout

```
index.html         entry point
src/app.js         router, builder, player and reply views
src/codec.js       link encoding + sanitizing of untrusted link data
src/templates.js   starter templates and new-block defaults
src/styles.css     chibi pastel themes (strawberry, matcha, lavender, sky)
test/              node:test unit tests
```

## Ideas after the MVP

- ✨ AI helper: "make me a page asking her to dinner, make it dramatic" generates the blocks (this needs a tiny server function to keep the API key private)
- More blocks: multiple choice, "pick a date" calendar, photo, scratch-to-reveal
- Short links + optional accounts so replies show up automatically
- Chibi illustrated stickers instead of emoji mascots
