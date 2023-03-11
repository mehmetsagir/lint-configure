#!/usr/bin/env node

/**
 * lint-configure
 *
 * @author Mehmet Sağır <https://github.com/mehmetsagir>
 */

import cli from "./utils/cli.js";

import LintConfig from "./lint-config.js";

const input = cli.input;
const flags = cli.flags;

(async () => {
  input.includes(`help`) && cli.showHelp();

  if (flags.version || flags.v) {
    cli.showVersion();
  }

  new LintConfig().init();
})();
