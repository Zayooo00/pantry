/** @type {import("prettier").Config} */
const config = {
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  printWidth: 100,
  tabWidth: 2,
  arrowParens: "always",
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindStylesheet: "./app/globals.css",
  tailwindFunctions: ["cn", "cva", "btn", "button", "chip"],
};

export default config;
