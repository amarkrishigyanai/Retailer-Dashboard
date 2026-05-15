// ─────────────────────────────────────────────
//  APP THEME CONFIG — edit this file only
//  to create a new white-label replica
// ─────────────────────────────────────────────

const theme = {
  // Branding
  brand: "Retailer management system",
  shortName: "Retailer management system",
  tagline: "Retailer Admin Panel",
  logo: "/logo.png",

  // API — set VITE_API_BASE in .env
  apiBase:
    import.meta.env.VITE_API_BASE ||
    "https://retailer-distributor-app.onrender.com/api",

  // Organisation label used across UI (replaces hard-coded "FPO")
  orgName: "Retailer",

  // Default login role
  defaultRole: "Retailer",

  // Primary color — Mint Green
  primary: "#3ECF8E",
  primaryDark: "#2BB57A",
  primaryLight: "#E8F8F1",
  primaryRgb: [62, 207, 142],
  pwaTheme: "#3ECF8E",
};

export default theme;
