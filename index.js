#!/usr/bin/env node

/**
 * lint-configure
 *
 * @author Mehmet Sağır <https://github.com/mehmetsagir>
 */

import cli from "./utils/cli.js";

import { init } from "./init.js";
import { removeOldFiles } from "./hooks/removeOldFiles.js";

const input = cli.input;
const flags = cli.flags;

(() => {
  input.includes("help") && cli.showHelp();

  if (flags.clear || flags.c) {
    return removeOldFiles();
  }

  if (flags.version || flags.v) {
    cli.showVersion();
  }

  init();
})();
