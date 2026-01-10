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
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "fade-out": "fadeOut 0.3s ease-out",
        "slide-in-from-top": "slideInFromTop 0.3s ease-out",
        "slide-in-from-bottom": "slideInFromBottom 0.3s ease-out",
        "spin-slow": "spin 2s linear infinite",
        "bounce-soft": "bounceSoft 2s ease-in-out infinite",
        "pulse-gentle": "pulseGentle 2s ease-in-out infinite"
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" }
        },
        slideInFromTop: {
          "0%": { 
            opacity: "0", 
            transform: "translateY(-10px)" 
          },
          "100%": { 
            opacity: "1", 
            transform: "translateY(0)" 
          }
        },
        slideInFromBottom: {
          "0%": { 
            opacity: "0", 
            transform: "translateY(10px)" 
          },
          "100%": { 
            opacity: "1", 
            transform: "translateY(0)" 
          }
        },
        bounceSoft: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" }
        },
        pulseGentle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" }
        }
      }
    }
  },
  plugins: []
};
