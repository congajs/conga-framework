module.exports = class CommandRegistry {

    constructor() {
        this.commands = {};
    }

    register(name, command) {
        this.commands[name] = command;
    }

    get(name) {
        return this.commands[name];
    }
}
