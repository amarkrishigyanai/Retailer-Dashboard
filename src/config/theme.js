// ─────────────────────────────────────────────
//  APP THEME CONFIG — edit this file only
//  to create a new white-label replica
// ─────────────────────────────────────────────

const theme = {
  // Branding
  brand: "Reatailer management system",
  shortName: "Reatailer",
  tagline: "Distributor Admin Panel",
  logo: "🏬",

  // API — set VITE_API_BASE in .env
  apiBase:
    import.meta.env.VITE_API_BASE ||
    "https://retailer-distributor-app.onrender.com/api",

  // Default login role
  defaultRole: "Distributor",

  // Primary color (must match CSS variables in index.css)
  primary: "#16a34a", // brand-600
  primaryDark: "#15803d", // brand-700
  primaryLight: "#dcfce7", // brand-100
  primaryRgb: [22, 163, 74],
  pwaTheme: "#16a34a",
};

export default theme;
