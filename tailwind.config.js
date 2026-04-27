/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#E8F8F1",
          100: "#C6EFD9",
          200: "#9DE3BF",
          300: "#6DD4A3",
          400: "#3ECF8E",
          500: "#2BB57A",
          600: "#229B67",
          700: "#1A7D53",
          800: "#12603F",
          900: "#0A422B",
        },
        sage: {
          50:  "#F0FBF6",
          100: "#D4F3E5",
          200: "#A8E7CB",
          300: "#6DD4A3",
          400: "#3ECF8E",
          500: "#2BB57A",
          600: "#229B67",
          700: "#1A7D53",
          800: "#12603F",
          900: "#0A422B",
        },
        cream: {
          100: "#F0FBF6",
          200: "#C6EFD9",
        },
        sky: {
          300: "#6DD4A3",
          400: "#3ECF8E",
        },
        // legacy aliases
        terracotta: "#3ECF8E",
        coral:      "#2BB57A",
        butter:     "#C6EFD9",
        darkbrown:  "#1a2e22",
        warmbrown:  "#4a7a62",
        gray: {
          50:  "#ffffff",
          100: "#f5f5f5",
          200: "#eeeeee",
          300: "#e0e0e0",
          400: "#bdbdbd",
          500: "#9e9e9e",
          600: "#757575",
          700: "#616161",
          800: "#424242",
          900: "#212121",
        },
      },
      fontFamily: {
        sans: ["Nunito", "sans-serif"],
      },
      borderRadius: {
        xl:   "14px",
        "2xl": "20px",
        "3xl": "24px",
      },
    },
  },
  plugins: [],
};
