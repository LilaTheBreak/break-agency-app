/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          black: "#000000",
          red: "#A70F0C",
          ivory: "#FAFAF6",
          linen: "#F1ECE6",
          white: "#FFFFFF"
        }
      },
      fontFamily: {
        display: ["'Delirium NCV'", "'Antonio'", "sans-serif"],
        subtitle: ["'Barlow Condensed'", "'Arial Narrow'", "sans-serif"],
        body: ["'Poppins'", "system-ui", "sans-serif"]
      },
      borderRadius: {
        billboard: "2.5rem"
      },
      boxShadow: {
        brand: "0 25px 80px rgba(0,0,0,0.12)"
      }
    }
  },
  plugins: []
};
