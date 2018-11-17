const Cleaner = require('./')

const eh = {
  me: true,
  nested: {
    really: {
      deep: {
        super: false,
        not: 'eh',
        canada: true,
        modules: [{parser: 'hi'}],
      },
      matchme: 'minime',
      notme: 'eh',
    },
  },
}

const cleaned = Cleaner.init(eh)
  .keys([/super/, /parser/])
  .vals([/minime/])
  .clean()

require('fliplog').quick(cleaned)
