#!/usr/bin/env node
import { exec } from "child_process";
import fs from "fs";
import inquirer from "inquirer";
import { createSpinner } from "nanospinner";
import chalk from "chalk";

class LintConfig {
  constructor() {
    this.config = {
      tailwindSupport: false,
      typescriptSupport: false,
      useNPM: false
    };
  }

  async init() {
    await this.supportTailwind();
    await this.supportTypeScript();
    await this.whichPackageManager();

    this.removeOldFiles();
  }

  async supportTailwind() {
    const supportTailwind = await inquirer.prompt({
      name: "value",
      type: "confirm",
      message: "Do you use TailwindCSS?",
      default() {
        return true;
      }
    });
    this.config.tailwindSupport = supportTailwind.value;
  }

  async supportTypeScript() {
    const supportTypeScript = await inquirer.prompt({
      name: "value",
      type: "confirm",
      message: "Do you use TypeScript?",
      default() {
        return true;
      }
    });
    this.config.typescriptSupport = supportTypeScript.value;
  }

  async whichPackageManager() {
    const usePackageManager = await inquirer.prompt({
      name: "value",
      type: "list",
      message: "Which one do you use?",
      choices: ["npm", "yarn"]
    });
    this.config.useNPM = usePackageManager.value === "npm";
  }

  removeOldFiles() {
    const message = createSpinner("Removing old files...").start();
    exec(
      "rm -rf .husky lint-staged.config.js .prettirrc .prettierrc.json .prettierrc.js .eslintrc.js .eslintrc.json .eslintrc .vscode",
      err => {
        if (err) {
          message.error({ text: "Error removing old files" });
          return;
        }
        message.success({ text: "Old files removed" });
        this.installPackages();
      }
    );
  }

  installPackages() {
    const message = createSpinner("Installing dependencies...").start();

    const packages = [
      "prettier",
      "eslint",
      "eslint-config-prettier",
      "eslint-plugin-prettier",
      "eslint-plugin-simple-import-sort",
      "husky",
      "lint-staged",
      "eslint-config-next"
    ];

    if (this.config.tailwindSupport) {
      packages.push("eslint-plugin-tailwindcss");
    }

    const command = `${
      this.config.useNPM ? "npm install" : "yarn add"
    } -D ${packages.join(" ")}`;

    exec(command, err => {
      if (err) {
        message.error({ text: "Error installing dependencies" });
        return;
      }
      message.success({ text: "Dependencies installed" });
      this.setScripts();
    });
  }

  setScripts() {
    const message = createSpinner("Setting scripts...").start();

    const scripts = [
      "npm set-script lint 'eslint --ext .js,.jsx,.ts,.tsx .'",
      "npm set-script 'lint:fix' 'eslint --ext .js,.jsx,.ts,.tsx . --fix'",
      "npm set-script 'format' 'npx prettier --write .'"
    ];

    if (this.config.typescriptSupport) {
      scripts.push("npm set-script 'type-check' 'tsc --noEmit'");
    }

    exec(scripts.join(" && "), err => {
      if (err) {
        message.error({ text: "Error setting scripts" });
        return;
      }
      message.success({ text: "Scripts set" });
      this.createFiles();
    });
  }

  createFiles() {
    const message = createSpinner("Creating files...").start();

    const handleError = err => {
      if (err)
        message.error({
          text: `Error creating file: ${chalk.red(err.path)} \n ${chalk.red(
            err.message
          )}`
        });
      return;
    };

    const createEslintConfiguration = () => {
      const config = JSON.parse(
        fs.readFileSync("./config/.eslintrc.json", "utf8")
      );

      if (this.config.typescriptSupport) {
        config.extends.push("next");
        config.extends.push("next/core-web-vitals");
      }

      if (this.config.tailwindSupport) {
        config.plugins.push("tailwindcss");

        config.rules["tailwindcss/classnames-order"] = "warn";
        config.rules["tailwindcss/enforces-negative-arbitrary-values"] = "warn";
        config.rules["tailwindcss/enforces-shorthand"] = "warn";
        config.rules["tailwindcss/migration-from-tailwind-2"] = "warn";
        config.rules["tailwindcss/no-arbitrary-value"] = "off";
        config.rules["tailwindcss/no-custom-classname"] = "warn";
        config.rules["tailwindcss/no-contradicting-classname"] = "error";
      }

      return JSON.stringify(config, null, 2);
    };

    fs.writeFile(
      ".eslintrc.json",
      createEslintConfiguration(),
      "utf8",
      handleError
    );

    fs.writeFile(
      ".prettierrc.json",
      fs.readFileSync("./config/.prettierrc.json"),
      "utf8",
      handleError
    );

    fs.writeFile(
      "lint-staged.config.js",
      fs.readFileSync("./config/lint-staged.config.js"),
      "utf8",
      handleError
    );

    fs.mkdir(".vscode", { recursive: true }, err => {
      if (err) {
        message.error({ text: "Error creating .vscode folder" });
        return;
      }

      fs.writeFile(
        ".vscode/settings.json",
        fs.readFileSync("./config/vscode-settings.json"),
        "utf8",
        handleError
      );
    });

    message.success({ text: "Files created" });
    this.createHuskyConfig();
  }

  createHuskyConfig() {
    const message = createSpinner("Creating husky...").start();

    exec("npx husky install", err => {
      if (err) {
        message.error({ text: "Error creating husky" });
        return;
      }

      fs.writeFile(
        ".husky/pre-commit",
        fs.readFileSync("./config/pre-commit"),
        "utf8",
        err => {
          if (err) {
            message.error({ text: "Error creating husky" });
            return;
          }

          exec("npm run lint:fix");
          exec("chmod ug+x .husky/*", () => {
            message.success({ text: "Husky created" });
          });
        }
      );
    });
  }
}

new LintConfig().init();
