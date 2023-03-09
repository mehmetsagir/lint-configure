import meow from "meow";
import meowHelp from "cli-meow-help";

const flags = {
  version: {
    type: "boolean",
    alias: "v",
    desc: "Print Lint Configure CLI version"
  },
  clear: {
    type: "boolean",
    alias: "c",
    desc: "Remove old files"
  }
};

const commands = {
  help: { desc: "Print help info" }
};

const helpText = meowHelp({
  name: `lint-configure`,
  flags,
  commands
});

const options = {
  inferType: true,
  description: false,
  hardRejection: false,
  flags
};

export default meow({
  importMeta: import.meta,
  help: helpText,
  options
});
