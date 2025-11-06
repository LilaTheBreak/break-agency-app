import eslintPluginImport from "eslint-plugin-import";
import eslintPluginPromise from "eslint-plugin-promise";
import eslintPluginN from "eslint-plugin-n";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [
      "plugin:import/recommended",
      "plugin:n/recommended",
      "plugin:promise/recommended"
    ],
    ignores: ["dist"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json"
      }
    },
    plugins: {
      import: eslintPluginImport,
      promise: eslintPluginPromise,
      n: eslintPluginN
    },
    rules: {
      "n/no-missing-import": "off",
      "n/no-unsupported-features/es-builtins": "off",
      "import/order": [
        "warn",
        {
          "alphabetize": { "order": "asc", "caseInsensitive": true },
          "newlines-between": "always"
        }
      ]
    }
  }
);
