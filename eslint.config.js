import vuePlugin from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
    // --- Vue 3 + TypeScript SFC support ---
    {
        files: ["**/*.vue"],
        languageOptions: {
            parser: vueParser,
            parserOptions: {
                parser: tsParser,
                extraFileExtensions: [".vue"],
                ecmaVersion: "latest",
                sourceType: "module",
            },
        },
        plugins: {
            vue: vuePlugin,
            "@typescript-eslint": tsPlugin,
        },
        rules: {
            ...vuePlugin.configs["flat/recommended"].rules, // ✅ correct key for ESLint v9
            "vue/multi-word-component-names": "off",
            "@typescript-eslint/no-unused-vars": "warn",
        },
    },

    // --- Plain TS and JS files ---
    {
        files: ["**/*.{ts,js}"],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: "latest",
            sourceType: "module",
        },
        plugins: {
            "@typescript-eslint": tsPlugin,
        },
        rules: {
            "@typescript-eslint/no-unused-vars": "warn",
        },
    },
];
