import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        pastel: {
          pink: "#FDF0F6",
          purple: "#E8DDFB",
          yellow: "#FFF9D2",
          text: "#6B5B95",
          accent: "#D6A2E8",
        }
      }
    },
  },
  plugins: [],
} satisfies Config;
