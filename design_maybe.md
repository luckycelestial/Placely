# Design Maybe: Hospitality-Premium Aesthetic

This design system is inspired by the "Food City" reservation interface, focusing on high-energy interactions, airy layouts, and a "Floating Surface" architecture.

## 🎨 Color Palette
- **Primary (Action)**: `#D35400` (Energetic Orange) - Used for call-to-actions, selection states, and primary highlights.
- **Background**: `#F9FAFB` (Soft Off-White) - Providing a clean, breathable canvas.
- **Surface**: `#FFFFFF` (Pure White) - For all primary cards and interactive containers.
- **Text (Primary)**: `#1A202C` (Deep Charcoal) - For high-contrast readability.
- **Text (Muted)**: `#718096` (Cool Gray) - For labels and secondary information.
- **Borders**: `#EDF2F7` (Whisp Gray) - Ultra-thin borders for subtle separation.

## 📐 Geometry & Spacing
- **Card Radius**: `16px` - Soft, approachable corners for all main containers.
- **Element Radius**: `12px` - For inputs, buttons, and smaller components.
- **Sidebar Width**: `80px` - Ultra-slim, icon-only navigation to maximize workspace.
- **Gutter/Gap**: `24px` - Generous spacing to maintain "airy" feel.

## 🧱 Key Components

### 1. Minimalist Command Sidebar
- **Style**: Floating vertical bar on the left.
- **Items**: Simple, linear icons with a vertical "Selection Indicator" (3px orange line) on the left of the active item.
- **Interaction**: Subtle scale-up effect on hover.

### 2. Floating Header
- **Search Bar**: Centered, large-radius input with a subtle inner shadow.
- **Profile Hub**: Integrated avatar and "Hi [Name] >" dropdown for a personalized touch.
- **Notifications**: Minimal bell icon with a vibrant red dot badge.

### 3. "The Stage" (Main Content)
- **Header Section**: Large, bold titles with metadata (like ratings or status) positioned to the right.
- **Hero Containers**: Large-scale imagery or maps with overflow-hidden rounded corners.
- **Contact/Info Chips**: Use icons (Location, Call, Message) paired with semi-bold text for tactile information display.

### 4. Interactive Tools (Reservation/Status)
- **Tactile Calendar**: A clean, grid-based date picker with "Dot Indicators" for active events (e.g., green for available, orange for selected).
- **Input Stack**: Vertical stack of dropdown-style selectors for Date, Time, and Category.
- **Button Duo**: A primary solid orange button ("Action") paired with a ghost/outline button ("Alternative").

## ✨ Interaction Philosophy
- **Soft Depth**: Use very light, blurred drop shadows (`0 4px 6px -1px rgba(0, 0, 0, 0.05)`) to make cards feel like they are floating above the gray background.
- **Tactile Feedback**: Every interactive element should have a hover state that feels "clickable"—either a background color shift or a slight lift.
- **Directional Navigation**: Use clean, rounded arrow buttons for carousels and pagination.
