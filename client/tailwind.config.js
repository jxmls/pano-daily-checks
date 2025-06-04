module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "../shared/**/*.{js,jsx,ts,tsx}", // ← if using shared folders
    "./public/index.html"             // ← helpful if using raw HTML
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
