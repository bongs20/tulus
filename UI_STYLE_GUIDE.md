# UI Style Guide - TULUS (Blue Theme)

Panduan visual ini melengkapi `UI_REDESIGN_BRIEF.md` dan menetapkan tema utama **biru**.

## 1) Design Direction

- Kesan: profesional, bersih, institusional.
- Dominan: biru untuk identitas utama sistem.
- Netral: abu terang untuk background dan border.
- Aksen: hijau/amber/merah untuk status proses.

## 2) Color Tokens

Gunakan token ini sebagai CSS variables/global theme:

```css
:root {
  --bg: #f6f9ff;
  --surface: #ffffff;
  --surface-muted: #f1f6ff;
  --text: #10233f;
  --text-muted: #5b6b84;
  --border: #d7e3f7;

  --primary-50: #eef5ff;
  --primary-100: #d9e9ff;
  --primary-200: #bdd8ff;
  --primary-300: #93beff;
  --primary-400: #5b9bff;
  --primary-500: #2f7fff;
  --primary-600: #1f63db;
  --primary-700: #194fb2;
  --primary-800: #173f8d;
  --primary-900: #16366f;

  --success: #1f9d5a;
  --warning: #d18a00;
  --danger: #d14343;
  --info: #2f7fff;
}
```

## 3) Status Colors

- `MENUNGGU`: `--warning` + background amber muda.
- `MATCH`: `--info` + background biru muda.
- `MISMATCH`: `--danger` + background merah muda.
- `DISETUJUI`: `--success` + background hijau muda.
- `DITOLAK`: `--danger` + background merah muda.
- `TERTUNDA`: ungu kebiruan lembut (`#5b5bd6`) + background `#f1f0ff`.

## 4) Component Rules

- `Button Primary`: `--primary-600`, hover `--primary-700`, text putih.
- `Button Secondary`: background `--primary-50`, text `--primary-800`.
- `Card`: putih, border `--border`, shadow halus.
- `Table Header`: `--surface-muted`, text `--text`.
- `Link`: `--primary-700`, hover underline.
- `Focus Ring`: `0 0 0 3px rgba(47, 127, 255, 0.25)`.

## 5) Chart Palette

Urutan default chart:
1. `#2f7fff`
2. `#1f63db`
3. `#5b9bff`
4. `#173f8d`
5. `#93beff`

## 6) Accessibility

- Pastikan rasio kontras teks utama >= WCAG AA.
- Jangan gunakan warna saja untuk makna status; selalu tambah label/badge text.
- State error form wajib punya teks penjelas, bukan hanya border merah.

## 7) Quick Mapping (Tailwind)

Jika memakai Tailwind, map token ke class semantik:
- `bg-app` -> `--bg`
- `bg-surface` -> `--surface`
- `text-app` -> `--text`
- `text-muted` -> `--text-muted`
- `border-app` -> `--border`
- `bg-primary` -> `--primary-600`
- `bg-primary-hover` -> `--primary-700`

