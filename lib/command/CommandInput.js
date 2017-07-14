module.exports = class CommandInput {

    constructor(args = {}, options = {}) {
        this.args = args;
        this.options = options;
    }

    getArgument(name) {
        return this.args[name];
    }

    getOption(name) {
        return this.options[name];
    }

    hasArgument(name) {
        return !(typeof this.args[name] === 'undefined');
    }

    hasOption(name) {
        return !(typeof this.options[name] === 'undefined');
    }
}
