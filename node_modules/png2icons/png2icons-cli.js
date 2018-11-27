#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var path_1 = require("path");
var PNG2ICONS = require("./png2icons");
var argc = process.argv.length;
var cli = path_1.parse(__filename).name;
var outputFormat;
var scalingAlgorithm = PNG2ICONS.BICUBIC;
var printInfo = false;
var scalingAlgorithms = [
    "Nearest Neighbor",
    "Bilinear",
    "Bicubic",
    "Bezier",
    "Hermite",
];
// Print usage
function usage() {
    // tslint:disable-next-line:no-shadowed-variable
    var usage = "usage: " + cli + " infile outfile format [-nn | - bl | -bc | -bz | -hm] [-i]\n\nDon't append a file extension to outfile, it will be set automatically.\n\nformat  (output format):\n  -icns  Apple ICNS format, creates <outfile>.icns\n  -ico   Windows ICO format, creates <outfile>.ico (contained icons as BMP)\n  -icop  Windows ICO format, creates <outfile>.ico (contained icons as PNG)\n  -all   Create both ICNS and ICO format (ICO with BMP)\n  -allp  Create both ICNS and ICO format (ICO with PNG)\n\nScaling algorithms:\n  -nn (Nearest Neighbor)\n  -bl (Bilinear)\n  -bc (Bicubic, default)\n  -bz (Bezier)\n  -hm (Hermite)\n\n-i  print messages";
    console.log(usage);
    process.exit(1);
}
// Get arguments
function evalArg(arg) {
    if (arg === "-nn") {
        scalingAlgorithm = PNG2ICONS.NEAREST_NEIGHBOR;
    }
    else if (arg === "-bl") {
        scalingAlgorithm = PNG2ICONS.BILINEAR;
    }
    else if (arg === "-bc") {
        scalingAlgorithm = PNG2ICONS.BICUBIC;
    }
    else if (arg === "-bz") {
        scalingAlgorithm = PNG2ICONS.BEZIER;
    }
    else if (arg === "-hm") {
        scalingAlgorithm = PNG2ICONS.HERMITE;
    }
    else if (arg === "-i") {
        printInfo = true;
    }
}
// Invalid argc or unknown args
if ((argc < 5) || (argc > 7)) {
    usage();
}
outputFormat = process.argv[4];
if (["-icns", "-ico", "-icop", "-all", "-allp"].indexOf(outputFormat) === -1) {
    usage();
}
for (var i = 5; i < argc; i++) {
    if (["-nn", "-bl", "-bc", "-bz", "-hm", "-i"].indexOf(process.argv[i]) === -1) {
        usage();
    }
}
// Either only debug or only a scaling algorithm is set
evalArg(process.argv[5]);
if (argc === 7) {
    // -i used twice
    if (printInfo && (process.argv[6] === "-i")) {
        usage();
    }
    else {
        evalArg(process.argv[6]);
        // Two scaling algorithms given
        if (!printInfo) {
            usage();
        }
    }
}
var Tasks = [];
if (outputFormat === "-icns") {
    Tasks.push({ Format: "ICNS", FileExt: "icns", Converter: PNG2ICONS.PNG2ICNS });
}
else if (outputFormat === "-ico") {
    Tasks.push({ Format: "ICO (BMP)", FileExt: "ico", Converter: PNG2ICONS.PNG2ICO_BMP });
}
else if (outputFormat === "-icop") {
    Tasks.push({ Format: "ICO (PNG)", FileExt: "ico", Converter: PNG2ICONS.PNG2ICO_PNG });
}
else if (outputFormat === "-all") {
    Tasks.push({ Format: "ICNS", FileExt: "icns", Converter: PNG2ICONS.PNG2ICNS });
    Tasks.push({ Format: "ICO (BMP)", FileExt: "ico", Converter: PNG2ICONS.PNG2ICO_BMP });
}
else if (outputFormat === "-allp") {
    Tasks.push({ Format: "ICNS", FileExt: "icns", Converter: PNG2ICONS.PNG2ICNS });
    Tasks.push({ Format: "ICO (PNG)", FileExt: "ico", Converter: PNG2ICONS.PNG2ICO_PNG });
}
else {
    usage(); //??
}
var inputFile = path_1.resolve(process.argv[2]);
var outputFileStub = path_1.resolve(process.argv[3]);
var input = fs_1.readFileSync(path_1.resolve(inputFile));
for (var i = 0; i < Tasks.length; i++) {
    var task = Tasks[i];
    if (printInfo) {
        var info = cli + ":\n  input:    " + inputFile + "\n  output:   " + outputFileStub + "." + task.FileExt + "\n  scaling:  " + scalingAlgorithms[scalingAlgorithm] + "\n  format:   " + task.Format;
        console.log(info);
    }
    var output = task.Converter(input, scalingAlgorithm, printInfo, 0);
    if (output) {
        fs_1.writeFileSync(outputFileStub + "." + task.FileExt, output);
        if ((printInfo) && (Tasks.length > 1) && (i < Tasks.length - 1)) {
            console.log("");
        }
    }
}
