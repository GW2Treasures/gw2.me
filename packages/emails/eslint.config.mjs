import reactConfig from '@gw2treasures/eslint-config/react';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**' ] },

  reactConfig,
);
