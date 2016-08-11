import includePaths from 'rollup-plugin-includepaths';
import nodeResolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';

export default {
  entry: 'src/index.js',
  dest: 'build/bundle.js',
  format: 'iife',

  globals: {
    three: 'THREE',
  },

  plugins: [
    includePaths({
      include: {},
      paths: ['.'],
      external: [],
      extensions: ['.js', '.json'],
    }),

    nodeResolve({
      module: true,
      jsnext: true,
      main: false,
      skip: [],
      browser: true,
      extensions: ['.js', '.json'],
      preferBuiltins: true,
    }),

    babel(),
  ],
};

