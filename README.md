# Aux FFXIV Plugin Listing Page

Static GitHub Pages site for Auxie Dalamud plugins, styled after the VCC listing layout and loaded live from `https://raw.githubusercontent.com/auxee/AuxDalamudRepo/main/repo.json`.

## Run locally

```bash
npx serve .
```

Then open the printed local URL in your browser.

## Deploy with GitHub Pages

1. Push this repository to GitHub on the `main` branch.
2. In repository settings, open **Pages** and set source to **GitHub Actions**.
3. The workflow in `.github/workflows/pages.yml` will publish the site automatically on each push to `main`.
