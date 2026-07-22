# Translation folder

Everything related to multi-language support lives here, so it's the one
place to look whether you're adding a language, fixing a translated string,
or changing how locale routing works.

```
translation/
  routing.js        locales list, URL-prefix rules, and the shared `paths`
                    object every page/component uses for links (the
                    replacement for the old menuPaths.js)
  navigation.js     locale-aware Link / usePathname / useRouter — components
                    import these instead of next/link, next/navigation
  request.js        loads the right JSON files for the current locale
                    (wired into next.config.mjs, you shouldn't need to touch it)
  settings.js       reads the CMS (Supabase) toggle for switcher visibility
                    and which locales it shows
  languages/
    en/             English — the source language, always complete
      common.json   short shared strings (buttons, prev/next, etc.)
      nav.json      header menu + search box labels
      footer.json   footer headings/links
      home.json     Home-page copy (hero, all 5 sections)
      seo.json      page <title>/description per locale
    fi/             Finnish — same file names, same keys, translated values
    de/             German  — same file names, same keys, translated values
```

## Adding or editing a translation

Open the file under `languages/<locale>/`, edit the string, save. The dev
server hot-reloads immediately. Every locale folder has the exact same file
names and the exact same JSON keys — only the values differ — so you can
open `en/home.json` and `fi/home.json` side by side and match line for line.

## Adding a new page's copy

1. Add a new namespace file, e.g. `languages/en/sauna.json`, and copy it to
   `fi/` and `de/` with translated values (same keys).
2. Register the namespace name in `request.js`'s `NAMESPACES` list.
3. In the page component: `const t = useTranslations('sauna')`.

If a key is missing in `fi/` or `de/`, the site automatically falls back to
the English value instead of breaking the page — see `request.js`.

## Adding a whole new language (e.g. French)

1. Add the locale code to `locales` in `routing.js`.
2. Copy `languages/en/` to `languages/fr/` and translate every value.
3. Add `fr` to `localeNames` in `routing.js` (used by the header language switcher,
   `src/components/Header/HeaderLanguageSwitcher.jsx`).

No page or component code needs to change — every page already reads
copy through `useTranslations`, which just picks up the new locale.

## Shared styling

Page layout/CSS is **not** duplicated per language. Every locale renders the
exact same components (Header, Footer, Home sections, etc.) with the exact
same classes from `src/app/globals.css` — only the text differs. That's what
makes "add a language" a translation-only change instead of a redesign.
