import { defineConfig, globalIgnores } from 'eslint/config';
import ymlPlugin from 'eslint-plugin-yml';
import parser from 'yaml-eslint-parser';

export default defineConfig([
    globalIgnores(['!**/*']),
    ...ymlPlugin.configs['flat/standard'],
    {
        files: ['**/*.yaml', '**/*.yml'],

        languageOptions: {
            parser: parser,
            ecmaVersion: 5,
            sourceType: 'script',

            parserOptions: {
                defaultYAMLVersion: '1.2',
            },
        },

        rules: {
            'license-header/header': 'off',

            'yml/quotes': [
                'error',
                {
                    prefer: 'single',
                    avoidEscape: true,
                },
            ],
        },
    },
]);
