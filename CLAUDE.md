# Vivante Life

vivante-life.eu is the Russian-language landing site for Vivante's transformational trips. The live page is Vivante Maldives (25 November 2026, 8 days), aimed at entrepreneurs and executives. Site copy is in Russian; keep new copy in Russian unless told otherwise.

## Layout

- `maldives/index.html` is the landing page. `/` (`index.html`) only redirects to `/maldives/`.
- `maldives/uploads/` holds the page's MP4 videos.
- `workers/telegram-form.js` is a Cloudflare Worker (`vivante-maldives-form.dennis-dok.workers.dev`) that receives the application form and posts it to a Telegram chat. Its secrets `BOT_TOKEN` and `CHAT_ID` live in the Cloudflare dashboard, never in the repo.
- Hosting is GitHub Pages on the custom domain in `CNAME` (`vivante-life.eu`). Pushing to `main` deploys.

## The landing page is a bundled export

`maldives/index.html` is about 14 MB: a self-unpacking bundle with images, fonts and scripts inlined as base64. The editable page is the JSON string inside `<script type="__bundler/template">`. To change copy, prices, dates or sections, edit that string in place and keep its JSON escaping (`\n`, `\"`, `<\/`). Don't reformat the file or re-encode assets, and don't read the whole file into context; search for the text you need.

After an edit, check that the template still parses:

```sh
python3 -c "import re,json;s=open('maldives/index.html').read();json.loads(re.search(r'<script type=\"__bundler/template\">(.*?)</script>',s,re.S).group(1))"
```

## Things that change often

- Price tiers (Early Bird / Standard / Last chance), with their dates and booking terms.
- The trip date, the founder section («Основатель проекта») and the form fields.
- If the form fields change, update both the page's `fetch` payload and `FIELDS` in the worker, and keep the hidden `website` honeypot field.

## Conventions

- No build step, no package manager, no tests.
- Commit messages are short, imperative English, e.g. "Update price tiers: new dates and booking terms".
- Keep diffs minimal so the history of the 14 MB file stays reviewable.
- Worker changes must be deployed in Cloudflare by Dennis; say so whenever the worker changes.
