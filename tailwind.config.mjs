/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        plum: {
          50: "#fbf6fb",
          100: "#f5eaf5",
          200: "#ead3ea",
          300: "#d9b0d8",
          400: "#c283bf",
          500: "#a85ea4",
          600: "#8d4688",
          700: "#73386e",
          800: "#5f305b",
          900: "#502b4d",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
