# Tenant Entry

## Purpose
The Tenant Entry screen is the public landing and authentication entry point for each college instance of Placely.

## User role
- Student.
- Placement Staff.
- Placement Admin.
- College Super Admin.

## Navigation placement
- This is the public entry screen before the user enters the student or admin shell.
- It is not part of the internal sidebar navigation.

## Screen goal
This screen should immediately feel like Placely, show strong brand presence, and still route the user into the correct login or shell experience.

## Core sections
- Large Placely brand header or hero area.
- College name or tenant label.
- Login or sign-in form.
- Fallback college code or email-domain check.
- Small help or support link.

## Key actions
- Identify the college.
- Sign in.
- Recover or continue login.
- Move into the appropriate student or admin shell.

## Content rules
- Make Placely branding prominent and memorable.
- Use a stronger visual identity than a plain auth page.
- Keep the brand polished but still focused on login.
- Support subdomain or domain-based tenant detection first.

## States
- College detected automatically.
- College selected manually.
- Login pending.
- Invalid college or access issue.

## Data needed
- College name.
- Branding.
- Login state.
- Tenant identifier.
- User role on sign-in.

## UX notes
- Let the Placely identity be clearly visible at first glance.
- Use a branded hero, accent panel, or strong top section.
- Keep the form clean beneath the branding.
- Ensure the screen routes cleanly to the student or admin side after login.

## Related screens
- Student Dashboard.
- Admin Dashboard.
- Role-based shells.

## File name
tenant-entry.md
