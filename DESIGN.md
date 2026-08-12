# Visual Design System & UI Specification

## 1. Aesthetic & Design Language
- **Style**: Modern institutional, clean, structured, and implementation-oriented.
- **Vibe**: High-contrast, sleek executive look featuring deep navy surfaces, bright gold highlights, soft rounded containers, and micro-shadow layering.
- **Theme Modes**: Full support for Light and Dark modes with smooth color transitions.

---

## 2. Color Palette & Tokens

### Primary Brand Palette
- **Navy Primary**: `oklch(0.22 0.058 265)` / Deep Slate Navy (`#0d1733`)
- **Navy Soft**: `oklch(0.35 0.1 262)` / Medium Navy Accent
- **Gold Accent**: `oklch(0.82 0.152 82)` / Bright Amber Gold
- **Navy Gradient**: `linear-gradient(150deg, oklch(0.19 0.05 265) 0%, oklch(0.33 0.11 262) 55%, oklch(0.27 0.09 264) 100%)`

### Surface & Neutral Palette
- **Canvas Background (Light)**: Soft off-white (`oklch(0.985 0.006 265)`)
- **Canvas Background (Dark)**: Deep Dark Slate (`oklch(0.17 0.045 265)`)
- **Card Surface**: Pure White (`#ffffff`) in light mode; Translucent Navy Surface (`oklch(0.22 0.058 265)`) in dark mode
- **Borders & Dividers**: Soft subtle borders (`oklch(0.91 0.014 265)`) with subtle alpha transparency in dark mode

### Indicator & Feedback Colors
- **Success / Active**: Emerald Green (`oklch(0.62 0.14 155)`)
- **Warning / Pending**: Soft Warm Amber (`oklch(0.78 0.15 68)`)
- **Destructive / Alert**: Coral Crimson (`oklch(0.577 0.245 27.325)`)

---

## 3. Typography
- **Primary Font**: `Plus Jakarta Sans`, `system-ui`, `sans-serif`
- **Base Body Text**: `16px` (`font-normal`, line-height `1.5`)
- **Headings & Titles**: Semi-bold to Bold geometric display headings with crisp contrast against dark navy backgrounds.

---

## 4. UI Layout & Structure

### Top Navigation / Brand Header
- **Appearance**: Dark gradient navy banner (`bg-navy-gradient`) with subtle gold accents.
- **Left**: Glowing brand logo/mark paired with institutional title and subtitle.
- **Center/Right**: Status indicators, contextual action pill buttons, and user profile avatar with status badges.

### Main Content Grid
- **Container**: Max-width centered container (`max-w-7xl` or `max-w-5xl`) with generous padding (`p-6` to `p-8`).
- **Hero / Header Banner**: Layered container featuring quick stats, operational phase indicators, and main CTA buttons.
- **Multi-Column Layout**: 
  - **Primary Workspace (2/3 width)**: Card-based grid for key interactive panels, management views, or primary data inputs.
  - **Sidebar Panel (1/3 width)**: Sticky feed card for notifications, pending invites, activity timelines, or secondary controls.

---

## 5. Visual Components & Styling

### Cards & Panels
- **Border Radius**: Smooth rounded corners (`rounded-xl` / `0.75rem`).
- **Shadows**: Dual-layered soft depth shadows (`shadow-card-soft` and `shadow-panel`).
- **Headers**: Clean card header dividers with distinct title typography and right-aligned action icons or badges.

### Status Badges & Pills
- **Shape**: Fully rounded pill shapes (`rounded-full`) with compact padding (`px-3 py-1`).
- **Style**: Soft tinted translucent background with bold, color-matched status text (e.g., green-tinted background for active states, amber-tinted for pending).

### Buttons & CTAs
- **Primary CTAs**: Filled Solid Navy or Gold accent buttons with subtle hover scale and brightness lift.
- **Secondary Buttons**: Soft surface buttons with subtle border outline (`variant="outline"`) and light gray hover tint.

### Modals & Dialog Overlays
- **Backdrop**: Blurred dark overlay (`backdrop-blur-sm bg-black/50`).
- **Window**: Centered floating card with crisp header divider, smooth scale-in animation, and explicit action footers.
