import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    // Strict typing
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': ['error', {
      allowExpressions: true,
      allowTypedFunctionExpressions: true,
      allowHigherOrderFunctions: true,
      allowDirectConstAssertionInArrowFunctions: true,
      allowConciseArrowFunctionExpressionsStartingWithVoid: true,
    }],

    // Arrow functions only
    'prefer-arrow-callback': 'error',
    'func-style': ['error', 'expression'],

    // Vue
    'vue/block-lang': ['error', { style: { lang: 'scss' } }],
    'vue/multi-word-component-names': 'off',
  },
})
