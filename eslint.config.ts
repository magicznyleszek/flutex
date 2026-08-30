import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist/**', '.parcel-cache/**', 'coverage/**'] },

  js.configs.recommended,
  tseslint.configs.recommended,
  // The `flat` variant has the same content as `configs['recommended-latest']`
  // but correct types — the latter declares `plugins` as an array of strings.
  reactHooks.configs.flat['recommended-latest'],

  {
    plugins: { '@stylistic': stylistic },
    rules: {
      // The project does not use semicolons.
      '@stylistic/semi': ['error', 'never'],
      // Without this, interfaces and type literals would still end each member
      // with a semicolon.
      '@stylistic/member-delimiter-style': [
        'error',
        {
          multiline: { delimiter: 'none' },
          // Single-line types are separated by commas — a semicolon would look
          // out of place next to the rest of the code.
          singleline: { delimiter: 'comma', requireLast: false },
        },
      ],
    },
  },
)
