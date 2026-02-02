/** @type {import('tailwindcss').Config} */
export const content = [
  "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  "./components/**/*.{js,ts,jsx,tsx,mdx}",
  "./app/**/*.{js,ts,jsx,tsx,mdx}",
];
export const darkMode = "class";
export const theme = {
  extend: {
    animation: {
      shimmer: "var(--animate-shimmer)",
    },
    screens: {
      standalone: { raw: "(display-mode: standalone)" },
    },
  },
};
export const plugins = [];
