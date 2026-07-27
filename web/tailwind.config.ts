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
        void: "#080A0E",
        surface: "#0F1218",
        elevated: "#161B24",
        neon: "#E8FF00",
        heat: "#FF4D00",
        cool: "#00B4FF",
        success: "#00E676",
        amber: "#FFC107",
        danger: "#FF3D00",
      },
      fontFamily: {
        display: ["var(--font-display)", "Barlow Condensed", "sans-serif"],
        sans: ["var(--font-body)", "Barlow", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px rgba(232, 255, 0, 0.15)",
        "glow-heat": "0 0 40px rgba(255, 77, 0, 0.2)",
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
      },
    },
  },
  plugins: [],
};

export default config;
