'use strict'

const helpers = require('./helpers')

module.exports = {
  prepend: '\nBuilds .tag files to .js\n\nOptions:',
  append: `
Build a single .tag file:

  riot foo.tag           To a same named file (foo.js)
  riot foo.tag bar.js    To a different named file (bar.js)
  riot foo.tag bar       To a different dir (bar/foo.js)

Build all .tag files in a directory:

  riot foo/bar           To a same directory (foo/**/*.js)
  riot foo/bar baz       To a different directory (baz/**/*.js)
  riot foo/bar baz.js    To a single concatenated file (baz.js)

Create an empty tag template

  riot --new foo
  riot --new foo/bar
  riot --new foo/bar --ext html

Examples for options:

  riot foo bar
  riot --config riot.config
  riot --w foo bar
  riot --watch foo bar
  riot --compact foo bar
  riot foo bar --compact
  riot foo.tag --type coffeescript --expr
  riot foo.tag --style sass --export css foo.css
  riot foo.tag --exclude css foo.js
  cat foo.tag | riot --stdin --stdout > foo.js

Version ${ helpers.getVersion() }
`,
  options: [
    {
      option: 'help',
      alias: 'h',
      type: 'Boolean',
      description: 'You\'re reading it'
    },
    {
      option: 'version',
      alias: 'v',
      type: 'Boolean',
      description: 'Print Riot\'s version'
    },
    {
      option: 'watch',
      alias: 'w',
      type: 'Boolean',
      description: 'Watch for changes'
    },
    {
      option: 'compact',
      alias: 'c',
      type: 'Boolean',
      description: 'Minify </p> <p> to </p><p>'
    },
    {
      option: 'modular',
      alias: 'm',
      type: 'Boolean',
      description: 'AMD and CommonJS'
    },
    {
      option: 'silent',
      alias: 's',
      type: 'Boolean',
      description: 'Silence build output'
    },
    {
      option: 'whitespace',
      type: 'Boolean',
      description: 'Preserve newlines and whitepace'
    },
    {
      option: 'check',
      type: 'Boolean',
      description: 'Check the syntax errors on a single tag'
    },
    {
      option: 'colors',
      type: 'Boolean',
      description: 'Turn on colorized output'
    },
    {
      option: 'expr',
      type: 'Boolean',
      description: 'Run expressions through parser defined with --type'
    },
    {
      option: 'config',
      type: 'String',
      description: 'Specify the path to a configuration file to compile your tags'
    },
    {
      option: 'export',
      type: 'String',
      alias: 'e',
      description: 'Compile and export only the css or html or js from your tags',
      example: 'riot foo.tag --export css foo.css',
      enum: ['css', 'js', 'html']
    },
    {
      option: 'new',
      type: 'String',
      alias: 'n',
      description: 'Create an empty tag template',
      example: 'riot --new foo'
    },
    {
      option: 'type',
      alias: 't',
      type: 'String',
      description: 'JavaScript pre-processor. Built-in support for: es6, coffeescript, typescript, livescript, none'
    },
    {
      option: 'exclude',
      type: 'String',
      description: 'Compile and excluding entities (css, html or js) from the output',
      enum: ['css', 'js', 'html'],
      example: 'riot foo.tag --exclude css --exclude html foo.js',
      concatRepeatedArrays: true
    },
    {
      option: 'template',
      type: 'String',
      description: 'HTML pre-processor. Built-in support for: pug'
    },
    {
      option: 'style',
      type: 'String',
      description: 'Css pre-processor. Built-in support for: sass, scss, less, stylus',
      example: 'riot foo.tag --style scss'
    },
    {
      option: 'brackets',
      type: 'String',
      description: 'Change brackets used for expressions. Defaults to { }'
    },
    {
      option: 'ext',
      type: 'String',
      default: 'tag',
      description: 'Change tag file extension. Defaults to .tag'
    },
    {
      option: 'stdin',
      alias: 'i',
      type: 'Boolean',
      description: 'Read stdin as tag file'
    },
    {
      option: 'stdout',
      alias: 'o',
      type: 'Boolean',
      description: 'Print output into stdout'
    }
  ]
}
