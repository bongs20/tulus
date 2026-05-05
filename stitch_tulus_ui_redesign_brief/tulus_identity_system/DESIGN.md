---
name: TULUS Identity System
colors:
  surface: '#faf8ff'
  surface-dim: '#d9d9e4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3fd'
  surface-container: '#ededf8'
  surface-container-high: '#e7e7f2'
  surface-container-highest: '#e1e2ec'
  on-surface: '#191b23'
  on-surface-variant: '#424654'
  inverse-surface: '#2e3038'
  inverse-on-surface: '#f0f0fa'
  outline: '#737785'
  outline-variant: '#c3c6d6'
  surface-tint: '#0057cf'
  primary: '#004bb5'
  on-primary: '#ffffff'
  primary-container: '#1f63db'
  on-primary-container: '#e6eaff'
  inverse-primary: '#b1c5ff'
  secondary: '#4e4ec9'
  on-secondary: '#ffffff'
  secondary-container: '#8283ff'
  on-secondary-container: '#120094'
  tertiary: '#8e3600'
  on-tertiary: '#ffffff'
  tertiary-container: '#b54700'
  on-tertiary-container: '#ffe6dc'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b1c5ff'
  on-primary-fixed: '#001946'
  on-primary-fixed-variant: '#00419e'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c1c1ff'
  on-secondary-fixed: '#0a006b'
  on-secondary-fixed-variant: '#3533b0'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb595'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7c2e00'
  background: '#faf8ff'
  on-background: '#191b23'
  surface-variant: '#e1e2ec'
typography:
  h1:
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontSize: 30px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  h3:
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  h4:
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-sm:
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.01em
  caption:
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  gutter: 16px
  margin: 24px
---

## Brand & Style
The brand personality of this design system is rooted in institutional reliability, civic duty, and modern efficiency. Designed for social services, it prioritizes a sense of calm authority and accessibility. 

The visual style follows a **Corporate/Modern** movement, utilizing expansive white space and a structured "Blue Identity" to foster trust. The aesthetic is "functional-first," stripping away decorative excess to ensure that users—often in high-stress situations—can navigate complex information with absolute clarity. The interface feels systematic, balanced, and premium, avoiding the coldness of traditional government software through the use of soft background tints and refined border treatments.

## Colors
The palette is dominated by an "Institutional Blue" hierarchy. The primary blue (#1f63db) serves as the anchor for actions and brand presence, while the background (#f6f9ff) provides a cool, low-strain canvas for long-duration usage.

Semantic colors are calibrated for high legibility against white surfaces, ensuring that status indicators for "Success" or "Danger" are immediately recognizable without vibrating against the primary blue. Borders use a specific tinted neutral (#d7e3f7) to maintain the blue-themed atmosphere even in the structural skeleton of the UI. Use the neutral palette primarily for typography (900 for headings, 600 for body) to maintain high contrast.

## Typography
This design system utilizes **Public Sans**, an institutional typeface designed for accessibility and clarity. The type scale is optimized for high data density, favoring slightly tighter line heights in headers to keep information compact, while maintaining a generous 1.5–1.6x line height for body text to ensure readability of social service case files and reports.

Weights are used functionally: **700/600** for structural hierarchy and **400** for content. In dense data grids, use **body-md** for standard cell content and **label-sm** for metadata or secondary tags.

## Layout & Spacing
The layout employs a **Fluid Grid** model with a 12-column structure, allowing the application to scale across desktops, tablets, and mobile devices used in field work. A strict 4px/8px atomic spacing system ensures vertical rhythm and consistent alignment of dense form fields.

Gutter widths are kept at a modest 16px to maximize information density without sacrificing visual separation. Components should utilize the "md" (16px) spacing unit for internal padding to maintain the clean, modern aesthetic of the overall system.

## Elevation & Depth
Depth is achieved through a combination of **Tonal Layering** and **Ambient Shadows**. Instead of traditional heavy shadows, this design system uses high-offset, low-opacity shadows tinted with the primary blue hue to maintain color harmony.

- **Level 0 (Floor):** The background color (#f6f9ff).
- **Level 1 (Card/Surface):** White (#ffffff) with a 1px border (#d7e3f7). No shadow.
- **Level 2 (Interactive/Floating):** White surface with a subtle 4px blur, 2px Y-offset shadow at 5% opacity (using a blue-tinted shadow color).
- **Level 3 (Overlay/Modals):** High-contrast separation with a 12px blur shadow at 8% opacity.

The goal is to create a "flat-plus" look where elements appear to sit just above the surface, rather than floating high above it.

## Shapes
The shape language is **Soft (1)**, using a base radius of 0.25rem (4px). This subtle rounding strikes a balance between the precision of a sharp-edged institutional tool and the approachability of a modern application.

- **Small Components (Buttons, Inputs):** 4px radius.
- **Medium Components (Cards, Modals):** 8px radius (rounded-lg).
- **Large Sections (Sidebars, Hero Areas):** 12px radius (rounded-xl).

Consistency in corner radii is critical to maintaining the professional, "shadcn-like" aesthetic. Avoid pill-shaped buttons except for specialized "Status" tags.

## Components
Consistent component styling is the cornerstone of this design system:

- **Buttons:** Primary buttons use #1f63db with white text. Ghost buttons use #1f63db text with a light blue hover state. All buttons feature a 4px radius and 1px border.
- **Input Fields:** Use a white surface, #d7e3f7 border, and a 2px blue focus ring. Labels must be positioned above the field using the **label-sm** typography style.
- **Cards:** Defined by a #ffffff background and a 1px #d7e3f7 border. Use a subtle shadow (Level 2 elevation) for interactive cards.
- **Chips/Status Tags:** Use light-tinted backgrounds of the semantic colors (e.g., Success background at 10% opacity) with the full-strength semantic color for the text.
- **Data Tables:** Use a clean, borderless row style with a 1px #d7e3f7 separator between rows. The header should be subtly tinted with the background color (#f6f9ff).
- **Progress Indicators:** Use the "Pending" color (#5b5bd6) for active stages in social service workflows to distinguish from completed "Success" steps.