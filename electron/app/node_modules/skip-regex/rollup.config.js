import buble from 'rollup-plugin-buble'

export default {
  entry: 'lib/skip-regex.js',
  dest: 'dist/skip-regex.js',
  format: 'cjs',
  plugins: [
    buble({
      target: {
        ie: 9, node: 4
      }
    })
  ]
}
