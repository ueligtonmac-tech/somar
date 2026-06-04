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
        "ug-blue": "var(--ug-blue)",
        "ug-blue-light": "var(--ug-blue-light)",
        "ug-blue-dark": "var(--ug-blue-dark)",
        "ug-gray-50": "var(--ug-gray-50)",
        "ug-gray-100": "var(--ug-gray-100)",
        "ug-gray-500": "var(--ug-gray-500)",
        "ug-gray-900": "var(--ug-gray-900)",
      },
      fontFamily: {
        sans: ["system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
