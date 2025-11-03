// eslint.config.js
import vue from 'eslint-plugin-vue';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
    {
        files: ['**/*.{js,ts,vue}'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module'
            },
            globals: {
                ...globals.browser,
                ...globals.node
            }
        },
        plugins: {
            vue,
            '@typescript-eslint': ts
        },
        rules: {
            'vue/multi-word-component-names': 'off',
            'no-unused-vars': 'warn'
        }
    },
    {
        files: ['**/*.vue'],
        processor: vue.processors['.vue']
    }
];
