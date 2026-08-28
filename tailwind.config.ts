import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontSize: {
        xs: ["1rem", { lineHeight: "1.5rem" }],
        sm: ["1.125rem", { lineHeight: "1.75rem" }],
        base: ["1.25rem", { lineHeight: "1.875rem" }],
        lg: ["1.5rem", { lineHeight: "2rem" }],
        xl: ["1.875rem", { lineHeight: "2.375rem" }],
        "2xl": ["2.25rem", { lineHeight: "2.75rem" }],
        "3xl": ["2.75rem", { lineHeight: "3.25rem" }],
        "4xl": ["3.5rem", { lineHeight: "1.1" }],
        "5xl": ["4.25rem", { lineHeight: "1.05" }],
        "6xl": ["5.25rem", { lineHeight: "1" }],
        "7xl": ["7rem", { lineHeight: "1" }],
        "8xl": ["9rem", { lineHeight: "1" }],
        "9xl": ["11rem", { lineHeight: "1" }],
      },
      fontWeight: {
        normal: "700",
        medium: "700",
        semibold: "700",
      },
      fontFamily: {
        sans: ["var(--font-geo)", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: [
          "var(--font-zen-dots)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
