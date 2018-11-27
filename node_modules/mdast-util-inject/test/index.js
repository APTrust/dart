'use strict'

var fs = require('fs')
var path = require('path')
var test = require('tap').test
var mdast = require('mdast')
var inject = require('../')

var fixtures = path.join(__dirname, 'fixtures')
var toInject = mdast.parse(fs.readFileSync(path.join(fixtures, 'inject.md'), 'utf-8'))

// Check any file in fixtures/ with something.blah.md, expecting output to equal
// contents of something.expected.md
fs.readdirSync(fixtures)
.filter(function (f) {
  return /\.[^.]+\.md$/.test(f) && !/expected\.md/.test(f)
})
.forEach(function (f) {
  test(f, testInputFile.bind(null, f))
})

function testInputFile (f, t) {
  var input = fs.readFileSync(path.join(fixtures, f), 'utf-8')
  var expectedFile = path.join(fixtures, f.replace(/[^.]*\.md/, 'expected.md'))

  function plugin (mdast) {
    return function transform (targetAst, file, next) {
      t.equal(inject('API', targetAst, toInject), f !== 'noop.input.md', 'returns true when heading found')
      next()
    }
  }

  mdast.use(plugin).process(input, function (err, file, content) {
    t.error(err)
    if (process.env.UPDATE) {
      fs.writeFileSync(expectedFile, content)
    }
    var expected = fs.readFileSync(expectedFile, 'utf-8')
    t.same(content, expected)
    t.end()
  })
}
