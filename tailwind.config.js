/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'DM Sans', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Playfair Display', 'serif'],
        body: ['var(--font-lora)', 'Lora', 'serif'],
      },
      colors: {
        ink: {
          DEFAULT: '#1a1208',
          50:  '#f8f6f2',
          100: '#ede9e0',
          200: '#d4ccbc',
          300: '#b5a98e',
          400: '#978462',
          500: '#7a6848',
          600: '#5f5038',
          700: '#453a28',
          800: '#2d261a',
          900: '#1a1208',
        },
        gold: {
          DEFAULT: '#c9a84c',
          50:  '#fdf9ee',
          100: '#f8edd0',
          200: '#f0d89e',
          300: '#e6c060',
          400: '#c9a84c',
          500: '#a8883a',
          600: '#876b2c',
          700: '#65501f',
          800: '#433514',
          900: '#211a0a',
        },
        paper: '#faf7f2',
        cream: '#f5f0e8',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        'book': '-4px 4px 16px rgba(0,0,0,0.2), 2px -1px 0px rgba(0,0,0,0.08)',
        'page': '0 4px 24px rgba(26,18,8,0.1)',
      },
    },
  },
  plugins: [],
}
