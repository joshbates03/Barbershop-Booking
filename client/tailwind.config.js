const withMT = require("@material-tailwind/react/utils/withMT");

module.exports = withMT({
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-dark' : '#090a0a',
        'secondary-dark' : '#121414',
        'third-dark' : '#161818',
        'text-body-dark' : '#ffffff',
        'header-text-dark' : '#e81922',
        'dark-main' : '#e81922',
        'darker-main': '#b8000d',
        'dark-textfield' : '#1f2323',
        'dark-error' : '#e81922',
        'green': '#12b543',
      },
      fontFamily: {
        'bodoni': ['Bodoni Moda', 'serif'],
        'roboto' : ['Roboto', 'serif'], 
      },
      height: {
        'image': '600px', 
      },
      width: {
        'image': '700px',  
      },
    },
  },
  plugins: [],
});
