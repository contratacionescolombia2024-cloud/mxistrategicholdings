
module.exports = {
  extends: ['expo', 'prettier'],
  plugins: ['react', 'react-hooks', 'import'],
  rules: {
    // Allow require() for dynamic imports in specific files
    '@typescript-eslint/no-require-imports': ['warn', {
      allow: [
        '@react-native-async-storage/async-storage',
        '@supabase/supabase-js'
      ]
    }],
    // Relax exhaustive-deps for intentional single-run effects
    'react-hooks/exhaustive-deps': 'warn',
    // Other rules
    'import/namespace': 'off', // Disable namespace checking for expo-localization
  },
};
