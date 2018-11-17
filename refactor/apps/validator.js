
function main() {
    console.log("This will soon be the DART command-line validator.");
    console.log("Here's the arg vector from the command line.");
    console.log(process.argv);
    console.log(new Date());
}

if (!module.parent) {
    main();
}
