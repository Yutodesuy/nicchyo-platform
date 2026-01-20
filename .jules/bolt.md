## 2026-01-19 - React.renderToStaticMarkup in Loops
**Learning:** Using `renderToStaticMarkup` inside a loop (e.g., for Leaflet markers) causes significant main-thread blocking because it triggers React's reconciliation process for each item synchronously.
**Action:** Replace `renderToStaticMarkup` with direct HTML string generation (using template literals) for high-frequency rendering tasks like map markers. Ensure dynamic content is properly escaped to prevent XSS.

## 2026-01-24 - Lazy Generation of Leaflet Icons
**Learning:** Generating multiple variants of Leaflet DivIcons (full, mid, compact) for every item at startup causes significant overhead (HTML string generation + object creation), even if most variants are never used.
**Action:** Implement lazy generation where icons are created only when the specific zoom level (mode) requires them, and cache the result. Use a Map to look up source data (shops) efficiently when generating icons on demand.
