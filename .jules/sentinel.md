## 2026-05-20 - [Reverse Tabnabbing Vulnerability]
**Vulnerability:** Found a link in src/app/admin/drives/page.tsx with target="_blank" but no rel="noopener noreferrer".
**Learning:** Reverse tabnabbing vulnerability where a linked site could manipulate the window.opener.
**Prevention:** Always add rel="noopener noreferrer" when using target="_blank".
