## 2026-01-19 - React.renderToStaticMarkup in Loops
**Learning:** Using `renderToStaticMarkup` inside a loop (e.g., for Leaflet markers) causes significant main-thread blocking because it triggers React's reconciliation process for each item synchronously.
**Action:** Replace `renderToStaticMarkup` with direct HTML string generation (using template literals) for high-frequency rendering tasks like map markers. Ensure dynamic content is properly escaped to prevent XSS.
