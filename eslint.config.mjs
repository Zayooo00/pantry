import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  prettierConfig,
  {
    rules: {
      "react/no-unescaped-entities": "off",
      "react-hooks/incompatible-library": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "import/no-anonymous-default-export": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "drizzle/**",
    "next-env.d.ts",
    "test.db",
    "local.db",
    "tsconfig.tsbuildinfo",
  ]),
]);
