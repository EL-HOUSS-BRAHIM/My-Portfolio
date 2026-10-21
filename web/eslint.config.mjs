import js from "@eslint/js";
import tseslint from "typescript-eslint";
import hooks from "eslint-plugin-react-hooks";
export default tseslint.config(
  {
    ignores: [
      ".next/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "next-env.d.ts",
      "src/lib/database.types.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.tsx"],
    plugins: { "react-hooks": hooks },
    rules: { ...hooks.configs.flat.recommended.rules },
  },
  {
    files: ["**/*.mjs"],
    languageOptions: { globals: { process: "readonly" } },
  },
);
