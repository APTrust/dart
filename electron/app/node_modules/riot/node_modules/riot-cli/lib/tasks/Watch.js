'use strict'

const
  Task = require('../Task'),
  Make = require('./Make'),
  chalk = require('chalk'),
  helpers = require('../helpers'),
  path = require('path'),
  cluster = require('cluster'),
  chokidar = require('chokidar')

/**
 * Watch the source file to run a Make command anytime there's a change
 */
class Watch extends Task {
  run(opt) {

    // main process
    if (cluster.isMaster && opt.isCli) {
      // from here we will spawn subprocesses
      // being sure that calls to process.exit coming from the js or css parsers
      // will not kill watch
      cluster.on('exit', () => cluster.fork({ isFirstFork: false }))
      cluster.fork({ isFirstFork: true  })
    } else {

      // subprocess that will be managed via the main process

      var
        glob = opt.flow[0] == 'f' ?
                opt.from :
                path.join(opt.from, '**/*.'+opt.ext),
        // the first subprocess must be detected
        isFirstFork = process.env.isFirstFork == 'true',
        watcher = chokidar.watch(glob, { ignoreInitial: !isFirstFork })

      watcher
        .on('ready', () => {
          helpers.log(
            chalk.cyan(
              isFirstFork ?
                `Watching: ${helpers.toRelative(glob)}` :
                `Process resumed! Watching: ${helpers.toRelative(glob)}`
            )
          )
        })
        .on('all', () => new Make(opt))

      return watcher

    }

  }
}

module.exports = Watch