module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",      // appディレクトリ（App Router）のファイルを走査
    "./pages/**/*.{js,ts,jsx,tsx}",    // pagesディレクトリがある場合
    "./components/**/*.{js,ts,jsx,tsx}"// components を使っているなら追加
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};