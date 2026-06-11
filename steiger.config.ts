import { defineConfig } from 'steiger';
import fsd from '@feature-sliced/steiger-plugin';

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // Pages/widgets that legitimately have no public API consumers yet,
    // and the app layer entrypoint — silence noise that doesn't apply to a demo app.
    files: ['**/*'],
    rules: {
      'fsd/insignificant-slice': 'off',
      'fsd/public-api': 'warn',
    },
  },
]);
