module.exports = class MemoryCommandOutput {

    constructor() {
        this.lines = [];
    }

    writeln(line) {
        this.lines.push(line);
    }

    getLine(num) {
        return this.lines[num];
    }

    dump() {
        this.lines.forEach((line) => {
            console.log(line);
        });
    }
}
