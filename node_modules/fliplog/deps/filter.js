let index = 0
const debugs = {}

function tagPasses(tags, filter, not) {
  if (tags.length === 0) return true

  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i]
    const includes = filter.includes(tag)
    debugs[index].tags.push({tag, i, not, includes})

    if (not && includes) return false
    // @TODO: later if only whitelisting...
    if (includes) return true
  }

  return true
}


// pass in tags & instance here just for fn filter
function shouldFilter({filters, tags, checkTags, instance}) {
  const hasStarFilter = filters.includes('*')
  const hasSilentFilter = filters.includes('silent')
  debugs[index].filters.push({hasStarFilter, hasSilentFilter})

  if (hasStarFilter) return false
  if (hasSilentFilter) return true

  let shouldBeFiltered = false

  for (let i = 0; i < filters.length; i++) {
    const filter = filters[i]

    if (typeof filter === 'function') {
      // because filter `allows` things through
      // whereas we are checking if it *should* be filtered OUT
      // and so it needs to return `false` to say it should be allowed :s
      // whitelist vs blacklist
      shouldBeFiltered = filter(Object.assign(instance.entries(), {
        tags,
        checkTags,
        debugs,
        index,
        filters,
      }))
      if (shouldBeFiltered === false) shouldBeFiltered = true
      return shouldBeFiltered
    }

    let not = filter.includes('!')
    let shouldFilterTag = false

    // @TODO: later, for arithmetics
    // if (filter.includes('&')) {
    //   // if it has `&` combine the filters
    //   shouldFilterTag = !filter
    //     .split('&')
    //     .map((tag) => tagPasses(filter, not))
    //     .filter((tag) => tag === false)
    //     .length === filter.split('&').length
    // }
    // else {
    shouldFilterTag = checkTags(filter, not)

    debugs[index].filters.push({not, filter, shouldFilterTag})

    if (shouldFilterTag === false) return true
  }

  return shouldBeFiltered
}

/**
 * @param  {Array<string>} filters filters to check
 * @param  {Array<string>} tags tags to check
 * @param  {Log} instance - fliplog instance
 * @return {boolean}
 */
function tagAndFilters({filters, tags, instance}) {
  // setup debug values for later
  index = index + 1
  debugs[index] = {
    filters: [],
    tags: [],
  }

  // bind the tags to the first arg
  const checkTags = tagPasses.bind(null, tags)

  // check whether we should filter
  const should = shouldFilter({checkTags, filters, tags, instance})
  // console.log(inspector(filters))
  return should
}

tagAndFilters.debugs = debugs

module.exports = tagAndFilters
