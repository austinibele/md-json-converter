// rollup.config.js
import babel from '@rollup/plugin-babel';

export default {
  input: 'src/index.js',
  output: {
    dir: 'dist',
    format: 'cjs'
  },
  plugins: [babel(
    {
      babelHelpers: 'bundled',
      presets: ['@babel/preset-react'],
    }
  )],
};