import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "test_*.js"
  ]),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/set-state-in-effect": "off",
      "react/jsx-no-undef": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "react-hooks/incompatible-library": "off",
      "@next/next/no-img-element": "off",
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/immutability": "off",
      "@typescript-eslint/no-require-imports": "off",
      "react/no-unescaped-entities": "off",
      "prefer-const": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off"
    }
  }
]);

export default eslintConfig;
