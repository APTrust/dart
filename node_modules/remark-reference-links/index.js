'use strict'

var visit = require('unist-util-visit')

module.exports = referenceLinks

var own = {}.hasOwnProperty

function referenceLinks() {
  return transformer
}

function transformer(node) {
  var definitions = {}
  var existing = []

  visit(node, 'definition', find(definitions, existing))
  visit(node, ['image', 'link'], factory(node, definitions, existing))
}

/* Find existing definitions. */
function find(definitions, existing) {
  return one

  function one(node) {
    var url = node.url

    existing.push(node.identifier)

    if (!own.call(definitions, url)) {
      definitions[url] = {}
    }

    definitions[url][node.title] = node
  }
}

/* Transform normal links and images into references and definitions,
 * replaces the current node, and adds a definition if needed. */
function factory(root, definitions, existing) {
  var id = 0

  return one

  /* Transform a normal link/image based on bound
   * `definitions`. */
  function one(node, index, parent) {
    var url = node.url
    var title = node.title
    var replacement
    var identifier
    var titles
    var definition

    if (own.call(definitions, url)) {
      titles = definitions[url]
    } else {
      titles = {}
      definitions[url] = titles
    }

    if (own.call(titles, title)) {
      identifier = titles[title].identifier
    } else {
      do {
        identifier = String(++id)
      } while (existing.indexOf(identifier) !== -1)

      definition = {
        type: 'definition',
        identifier: identifier,
        title: title,
        url: url
      }

      titles[title] = definition

      root.children.push(definition)
    }

    replacement = {
      type: node.type + 'Reference',
      identifier: identifier,
      referenceType: 'full'
    }

    if (node.type === 'image') {
      replacement.alt = node.alt
    } else {
      replacement.children = node.children
    }

    parent.children[index] = replacement
  }
}
