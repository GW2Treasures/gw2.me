import config from '@gw2treasures/eslint-config';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**' ] },

  config,
);
