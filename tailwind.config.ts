import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#e6f7f7",
          100: "#b3e8e8",
          200: "#80d9d9",
          300: "#4dcaca",
          400: "#26bebe",
          500: "#008282",
          600: "#006e6e",
          700: "#005a5a",
          800: "#003f3f",
          900: "#002626",
          950: "#001414",
        },
      },
      fontFamily: {
        sans: ["'DM Sans'", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'DM Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        "card":    "0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
        "card-lg": "0 4px 16px -2px rgb(0 0 0 / 0.12), 0 2px 6px -2px rgb(0 0 0 / 0.08)",
        "brand":   "0 4px 14px 0 rgb(0 130 130 / 0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
