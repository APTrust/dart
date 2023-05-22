const path = require('path')
const { SimpleLineParser } = require("./simple_line_parser");

test('Simple line parser', () => {
    let testFile = path.join(__dirname, "..", "test", "fixtures", "bag-info.txt");
    let parser = new SimpleLineParser(testFile)
    expect(parser.pathToFile).toEqual(testFile)
    let lines = parser.getLines(true)
    expect(lines.length).toEqual(17)
    expect(lines[0].startsWith('Source-Organization')).toBe(true) 
    expect(lines[16].startsWith('Final-Tag')).toBe(true) 

    // Parse again, but don't omit empty line.
    // Last line of file is empty, so we should get
    // one more than above.
    lines = parser.getLines(false)
    expect(lines.length).toEqual(18)
    expect(lines[0].startsWith('Source-Organization')).toBe(true) 
    expect(lines[16].startsWith('Final-Tag')).toBe(true) 
    expect(lines[17]).toEqual('')
});