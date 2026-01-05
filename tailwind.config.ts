import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "organic-green": "#166534",
      "organic-cream": "#fefbe9",
      "organic-brown": "#bfa98a",
      "organic-earth": "#947b67",
        brand: {
          600: "#80C147",
          700: "#6BAE3A",
        },
      },
    },
  },
  plugins: [],
};
export default config;
