# shadscan Audit Decisions

Recorded 2026-08-08 against `@shadscan/cli` 0.11.0. Final score: **90/100 (Grade A)**.
Foundation 20/20, Interaction 11/20, States 20/20, Accessibility 20/20, Production Polish 10/10.

## Decision disposition

| Finding | Disposition | Decision | Rationale |
| --- | --- | --- | --- |
| `command-menu-present` | decide | **Implement** | Full `CommandDialog` (cmdk) mounted via `src/layouts/main.astro` (`<CommandDialog client:load />`) with an input, empty state, and 129 character/section items. Opens from the header search button and via `Ctrl/Cmd+K`. The shadscan rule still reports fail because 0.11.0 has no Astro shell-mount detection (`getShellCandidates` falls back to `src/main.tsx`, which does not exist, so `mountedFiles` is empty). This is a tool gap, not a code gap. |
| `command-menu-hotkey-present` | decide | **Implement** | `Ctrl/Cmd+K` handler wired in `command-menu.tsx` (keydown listener, preventDefault, toggle open). Same static-detection tool gap as above. |
| `public-app-seo-files-present` | decide | **Implement** | App is a single-page guide; indexing `public/sitemap.xml` (single canonical URL) and `public/robots.txt` (Sitemap: /sitemap.xml) so crawlers can index the one page. |
| `button-icons-have-data-icon` | verify | **Implement** | Added `data-icon="inline-start"` to every leading icon inside a shadcn `Button`: the add-character dialog avatar (`add-character-dialog.tsx`), the character-card training button (`character-grid.tsx`), and the theme-option buttons (`theme-selector.tsx`). The `CharacterIcon` prop is forwarded to the rendered `img`. |
| `color-contrast-passes` | verify | **Implement** | Dark theme `--muted-foreground` brightened `oklch(0.711 …)` → `oklch(0.78 0.019 323.02)`, raising contrast to 4.75:1 on background, 4.65:1 on muted, 4.71:1 on card (was ~3.0:1). Light theme unchanged (14.7:1). |
| `destructive-actions-confirmed` | verify | **Waive** | Remove flow already shows a confirmation dialog (`Remove "X"? … Cancel / Remove`) with a loss-of-progress warning. Verified at runtime. |
| `forms-have-labels` | verify | **Waive** | All form controls use `aria-label` (e.g., search inputs: "Search characters"). Labels resolve at runtime. |
| `icon-buttons-have-labels` | verify | **Waive** | Every icon button carries an `aria-label` ("Search and navigate", "Open theme selector", "Add character", "Remove <name>", …). Verified at runtime. |
| `images-have-alt` | verify | **Waive** | Character portraits use `alt={character.name}`; decorative 16px element icons use intentional `alt=""` (name text is adjacent). |
| `pointer-target-size-passes` | verify | **Implement** | `icon-lg` button size bumped `size-9` → `size-11` (36px → 44px), covering search, theme, add-character, and card remove buttons. Text controls remain ≥ 24px. |
| `mobile-overflow-absent` | verify | **Waive (manual)** | Not verifiable in the automation viewport (locked at 1280px). Layout uses the responsive app-shell container with `overflow-y-auto` content columns; recommend a manual 320px check before release. |

## Intentional tool-gap note

The two command-menu rules can never pass statically in shadscan 0.11.0 on this Astro project: the bundle's shell-mount detection only understands React entry points (`src/main.tsx` / `src/App.tsx`) and `.tsx` sources, so `mountedFiles` is empty for an Astro app. No fake `src/main.tsx` or unused infrastructure was added to inflate the score.
