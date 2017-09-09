'use strict'

module.exports = Object.freeze({
  // global stuff
  TEMP_FILE_NAME: /\/[^.~][^~/]+$/,
  // cli messages TODO: add all the other messages here
  NO_FILE_FOUND: 'Source path does not exist',
  // modular output fragments
  MODULAR_START_FRAG: `
(function(tagger) {
  if (typeof define === 'function' && define.amd) {
    define(function(require, exports, module) { tagger(require('riot'), require, exports, module)})
  } else if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    tagger(require('riot'), require, exports, module)
  } else {
    tagger(window.riot)
  }
})(function(riot, require, exports, module) {
`,
  MODULAR_END_FRAG: '});',
  TAG_CREATED_CORRECTLY: function(path) {
    return `${path} created correctly!`
  },
  PREPROCESSOR_NOT_REGISTERED: function(type, id) {
    return `The "${id}" ${type} preprocessor was not found. Have you registered it?`
  },
  // default tag template
  TAG_TEMPLATE: function(tagName) {
    return `
<${tagName}>
  <p>Hi { message() }</p>
  <script>
    message() {
      return 'there'
    }
  </script>

  <style>
    :scope p {
      color: #000;
    }
  </style>
</${tagName}>
`
  }
})
