module.exports = {
  // ----------------------------- story ------------------

  // @TODO:
  story() {
    if (!this.mainStory) {
      const {mainStory} = require('storyboard')
      this.mainStory = mainStory
    }
    return this
  },
  child(title) {
    const story = this.mainStory.child({title})
    story.parent = this
    return story
  },
}
