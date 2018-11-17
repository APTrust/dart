module.exports = {
  deps: {
    'cli-table2': '0.2.0',
  },

  // reset() {
  //   // this.delete('table')
  // },

  /**
   * @tutorial https://github.com/fliphub/fliplog#-tables
   * @param  {Array<string>} head
   * @param  {Array<any>} data
   * @return {FlipLog}
   */
  table(head, data) {
    const Table = this.requirePkg('cli-table2')

    this.row = row => this.Table.push(data)

    if (!data) {
      let table = new Table({head})
      this.Table = table
      return this
    }

    let table = new Table({head})
    table.push(data)
    this.Table = table

    return this.data(table.toString())
  },
}
