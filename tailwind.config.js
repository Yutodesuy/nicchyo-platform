module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",      // appディレクトリ（App Router）のファイルを走査
    "./pages/**/*.{js,ts,jsx,tsx}",    // pagesディレクトリがある場合
    "./components/**/*.{js,ts,jsx,tsx}"// components を使っているなら追加
  ],
  theme: {
    extend: {
      colors: {
        'nicchyo-base': '#FFFAF0',
        'nicchyo-primary': '#7ED957',
        'nicchyo-accent': '#FFDE59',
        'nicchyo-ink': '#3A3A3A',
        'nicchyo-soft-green': '#A0D7A7',
      },
    },
  },
  plugins: [],
};