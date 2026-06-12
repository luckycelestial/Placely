# Bolt's Journal

## 2026-06-03 - Memoize Stats Calculations on Search Entry
**Learning:** Stats computations and grid filtration re-evaluate on every single keypress in search input. Memoizing these using `useMemo` avoids redundant iteration over arrays when typing.
**Action:** Wrap filtering logic and stats evaluation in `useMemo` dependent only on variables that actually impact the calculations.
