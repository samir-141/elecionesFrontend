/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border, 214.3 31.8% 91.4%))",
        input: "hsl(var(--input, 214.3 31.8% 91.4%))",
        ring: "hsl(var(--ring, 222.2 84% 4.9%))",
        background: "hsl(var(--background, 0 0% 100%))",
        foreground: "hsl(var(--foreground, 222.2 84% 4.9%))",
        primary: {
          DEFAULT: "#0F172A", // Azul institucional oscuro
          foreground: "#F8FAFC",
          light: "#1E40AF",
        },
        secondary: {
          DEFAULT: "#F1F5F9",
          foreground: "#0F172A",
        },
        destructive: {
          DEFAULT: "#B91C1C",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F8FAFC",
          foreground: "#64748B",
        },
        accent: {
          DEFAULT: "#E2E8F0",
          foreground: "#0F172A",
        },
        civic: {
          blue: "#1E3A8A",
          green: "#15803D",
          amber: "#B45309",
          red: "#B91C1C",
          card: "#FFFFFF",
          canvas: "#F8FAFC",
        },
      },
      borderRadius: {
        lg: "var(--radius, 0.5rem)",
        md: "calc(var(--radius, 0.5rem) - 2px)",
        sm: "calc(var(--radius, 0.5rem) - 4px)",
      },
      minHeight: {
        touch: "48px",
      },
      minWidth: {
        touch: "48px",
      },
    },
  },
  plugins: [],
};

