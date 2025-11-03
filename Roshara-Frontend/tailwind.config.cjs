// tailwind.config.js
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./pages/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      spacing: {
        30: "7.5rem",
        94: "23.5rem",
        100: "25rem",
        105: "26rem",
      },
      fontSize: {
        // if you ever used text-ms
        ms: "0.9375rem",
      },
    },
  },
  plugins: [],
};
