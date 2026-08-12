---
name: Academic Excellence Framework
colors:
  surface: '#f8f9fb'
  surface-dim: '#d9dadc'
  surface-bright: '#f8f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f6'
  surface-container: '#edeef0'
  surface-container-high: '#e7e8ea'
  surface-container-highest: '#e1e2e4'
  on-surface: '#191c1e'
  on-surface-variant: '#434750'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f3'
  outline: '#747781'
  outline-variant: '#c3c6d2'
  surface-tint: '#395da0'
  primary: '#002556'
  on-primary: '#ffffff'
  primary-container: '#0b3a7b'
  on-primary-container: '#84a6ee'
  inverse-primary: '#adc6ff'
  secondary: '#7c5800'
  on-secondary: '#ffffff'
  secondary-container: '#ffbb16'
  on-secondary-container: '#6c4d00'
  tertiary: '#451900'
  on-tertiary: '#ffffff'
  tertiary-container: '#682900'
  on-tertiary-container: '#ec905f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#1c4586'
  secondary-fixed: '#ffdea6'
  secondary-fixed-dim: '#ffbb16'
  on-secondary-fixed: '#271900'
  on-secondary-fixed-variant: '#5e4200'
  tertiary-fixed: '#ffdbcb'
  tertiary-fixed-dim: '#ffb691'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#763309'
  background: '#f8f9fb'
  on-background: '#191c1e'
  surface-variant: '#e1e2e4'
  institutional-blue: '#0B3A7B'
  accent-gold: '#FDB913'
  surface-gray: '#F3F4F6'
  pure-white: '#FFFFFF'
typography:
  display-lg:
    fontFamily: IBM Plex Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: IBM Plex Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: IBM Plex Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: IBM Plex Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  caption:
    fontFamily: IBM Plex Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-desktop: 80px
  margin-tablet: 40px
  margin-mobile: 20px
  section-gap: 120px
---

## Brand & Style

This design system embodies a **Corporate / Modern** aesthetic tailored for higher education. It balances the traditional authority of an academic institution with a clean, forward-thinking digital interface. The style emphasizes clarity, reliability, and institutional prestige through a structured grid and a sophisticated color relationship.

The visual narrative is built on the foundation of "Structured Discovery." It uses ample white space to ensure information density never feels overwhelming, allowing the primary institutional colors to guide the user's journey. Surfaces are clean, and the interaction model is predictable and grounded, evoking a sense of trust and professional stability for students, faculty, and stakeholders.

## Colors

The palette is anchored by **Institutional Blue**, representing stability and academic rigor. This is contrasted by **Accent Gold**, used purposefully for calls to action, high-level highlights, and indicators of achievement. 

- **Primary (Blue):** Used for headers, primary navigation backgrounds, and structural elements.
- **Secondary (Gold):** Reserved for highlights, active states, and critical buttons.
- **Neutral (Gray/White):** The background strategy relies on `#FFFFFF` for content areas and `#F3F4F6` for subtle section grouping and decorative backgrounds.
- **Text:** Use the primary blue for headlines to maintain brand consistency, and a high-contrast dark gray (derived from the blue) for long-form body copy.

## Typography

The typography system utilizes **IBM Plex Sans** exclusively to convey a technical yet humanistic feel. The typeface’s engineering-inspired terminals and clear apertures make it ideal for an engineering college.

- **Headlines:** Set in the primary blue. Use tight letter-spacing for display sizes to create a modern, high-impact look.
- **Body Copy:** Focus on legibility with generous line heights (1.5x - 1.6x). 
- **Labels:** Use uppercase styling with slight letter spacing for category tags and small UI metadata to differentiate from standard body text.

## Layout & Spacing

This design system employs a **12-column fixed grid** for desktop, transitioning to a **6-column grid** for tablet and a **2-column grid** for mobile. 

- **Vertical Rhythm:** Spacing follows a 4px baseline. Use 120px gaps between major landing page sections to give the content "room to breathe," reflecting a premium institutional feel.
- **Containers:** Content is housed in a max-width container (1280px) to ensure readability on ultra-wide monitors.
- **In-page Spacing:** Use a consistent 24px gutter between card elements and 48px for internal component grouping.

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Layers** and extremely subtle **Ambient Shadows**.

- **Surfaces:** Use the Neutral gray (`#F3F4F6`) as a base layer for the page. Elements that require attention (cards, modals) are elevated using white (`#FFFFFF`) backgrounds.
- **Shadows:** Avoid heavy, dark shadows. Use a "Soft Lift" effect: `0px 4px 20px rgba(11, 58, 123, 0.08)`. The slight blue tint in the shadow ties the elevation back to the brand color.
- **Layering:** Navigation bars should remain pinned with a subtle bottom border or very low-opacity shadow to indicate they sit above the content scroll.

## Shapes

The shape language is **Soft** and professional. This prevents the UI from feeling too sharp and aggressive while avoiding the overly "bubbly" look of consumer social apps.

- **Core Elements:** Buttons, input fields, and small cards use a 4px (0.25rem) radius.
- **Containers:** Larger feature cards and image containers can scale up to 8px (0.5rem) to soften the layout.
- **Icons:** Use geometric, line-based icons with consistent stroke weights to match the IBM Plex Sans aesthetic.

## Components

- **Buttons:** 
    - *Primary:* Solid Gold (`#FDB913`) with Blue text for high visibility.
    - *Secondary:* Solid Blue (`#0B3A7B`) with White text for institutional actions.
    - *Ghost:* Blue outline with Blue text for secondary navigation.
- **Cards:** 
    - Standard cards feature a white background, 4px radius, and a subtle 1px border (`#E5E7EB`) or the "Soft Lift" shadow. 
    - Academic cards (programs/departments) should include a top-accent border in Gold.
- **Inputs:** 
    - Use a light gray background (`#F9FAFB`) with a 1px border that turns Blue on focus.
- **Navigation:**
    - The main header should be white with the logo positioned left. Top-level links use the Primary Blue in the `label-md` style.
- **Chips/Badges:** 
    - Used for "New," "Upcoming," or category filters. Use a desaturated blue background with deep blue text for a professional look.