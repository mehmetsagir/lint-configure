#!/usr/bin/env node
import {exec} from "child_process";
import fs from "fs";
import inquirer from "inquirer";
import {createSpinner} from "nanospinner";
import chalk from "chalk";
import {removeOldFiles} from "./hooks/removeOldFiles.js";

const SUPPORTED_FRAMEWORKS = {
    NEXTJS: "Next.js",
    REACTJS: "React.js"
};

const config = {
    tailwindSupport: false,
    typescriptSupport: false,
    useNPM: false,
    whichFramework: SUPPORTED_FRAMEWORKS.NEXTJS, // Next.js || React.js
};

async function supportTailwind() {
    const supportTailwind = await inquirer.prompt({
        name: "value",
        type: "confirm",
        message: "Do you use TailwindCSS?",
        default() {
            return true;
        },
    });
    config.tailwindSupport = supportTailwind.value;
}

async function supportTypeScript() {
    const supportTypeScript = await inquirer.prompt({
        name: "value",
        type: "confirm",
        message: "Do you use TypeScript?",
        default() {
            return true;
        },
    });
    config.typescriptSupport = supportTypeScript.value;
}

async function whichPackageManager() {
    const usePackageManager = await inquirer.prompt({
        name: "value",
        type: "list",
        message: "Which one do you use?",
        choices: ["npm", "yarn"],
    });
    config.useNPM = usePackageManager.value === "npm";
}

async function whichFramework() {
    const useFramework = await inquirer.prompt({
        name: "value",
        type: "list",
        message: "Which one do you use the framework?",
        choices: ["Next.js", "React.js"],
    });
    config.whichFramework = useFramework.value;
}

function installPackages() {
    const message = createSpinner("Installing dependencies...").start();

    const packages = [
        "prettier",
        "eslint",
        "eslint-config-prettier",
        "eslint-plugin-prettier",
        "eslint-plugin-simple-import-sort",
        "husky",
        "lint-staged",
        "eslint-config-next",
    ];

    if (config.tailwindSupport) {
        packages.push("eslint-plugin-tailwindcss");
    }

    const command = `${config.useNPM ? "npm install" : "yarn add"
    } -D ${packages.join(" ")}`;

    exec(command, (err) => {
        if (err) {
            message.error({text: "Error installing dependencies"});
            return;
        }
        message.success({text: "Dependencies installed"});
        setScripts();
    });
}

function setScripts() {
    const message = createSpinner("Setting scripts...").start();

    const scripts = [
        "npm set-script lint 'eslint --ext .js,.jsx,.ts,.tsx .'",
        "npm set-script 'lint:fix' 'eslint --ext .js,.jsx,.ts,.tsx . --fix'",
        "npm set-script 'format' 'npx prettier --write .'",
    ];

    if (config.typescriptSupport) {
        scripts.push("npm set-script 'type-check' 'tsc --noEmit'");
    }

    exec(scripts.join(" && "), (err) => {
        if (err) {
            message.error({text: "Error setting scripts"});
            return;
        }
        message.success({text: "Scripts set"});
        createFiles();
    });
}

function createFiles() {
    const message = createSpinner("Creating files...").start();

    const handleError = (err) => {
        if (err) {
            return message.error({
                text: `Error creating file: ${chalk.red(err.path)} \n ${chalk.red(
                    err.message
                )}`,
            });
        }
    };

    const createEslintConfiguration = () => {
        const lintConfig = JSON.parse(
            fs.readFileSync("./config/.eslintrc.json", "utf8")
        );

        switch (config.whichFramework) {
            case SUPPORTED_FRAMEWORKS.NEXTJS:
                lintConfig.extends.push("next");
                lintConfig.extends.push("next/core-web-vitals");
                break;

            case SUPPORTED_FRAMEWORKS.REACTJS:
                lintConfig.extends.push("plugin:react/recommended",);
                break;
        }

        if (config.tailwindSupport) {
            lintConfig.plugins.push("tailwindcss");

            lintConfig.rules["tailwindcss/classnames-order"] = "warn";
            lintConfig.rules["tailwindcss/enforces-negative-arbitrary-values"] = "warn";
            lintConfig.rules["tailwindcss/enforces-shorthand"] = "warn";
            lintConfig.rules["tailwindcss/migration-from-tailwind-2"] = "warn";
            lintConfig.rules["tailwindcss/no-arbitrary-value"] = "off";
            lintConfig.rules["tailwindcss/no-custom-classname"] = "warn";
            lintConfig.rules["tailwindcss/no-contradicting-classname"] = "error";
        }

        return JSON.stringify(lintConfig, null, 2);
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

    fs.mkdir(".vscode", {recursive: true}, (err) => {
        if (err) {
            message.error({text: "Error creating .vscode folder"});
            return;
        }

        fs.writeFile(
            ".vscode/settings.json",
            fs.readFileSync("./config/vscode-settings.json"),
            "utf8",
            handleError
        );
    });

    message.success({text: "Files created"});
    createHuskyConfig();
}

function createHuskyConfig() {
    const message = createSpinner("Creating husky...").start();

    exec("npx husky install", (err) => {
        if (err) {
            message.error({text: "Error creating husky"});
            return;
        }

        const typeCheck = `
echo "🔎 Checking validity of types with TypeScript"

yarn type-check || (
  "⛔️ There is a type error in the code, fix it, and try commit again. ⛔️";
  false;
)

echo "\n✅ No TypeError found"`

        const preCommit = fs.readFileSync("./config/pre-commit", "utf-8")

        fs.writeFile(
            ".husky/pre-commit",
            preCommit.replace("{{typeCheck}}", config.typescriptSupport ? typeCheck : ""),
            "utf8",
            (err) => {
                if (err) {
                    message.error({text: "Error creating husky"});
                    return;
                }

                exec("npm run lint:fix");
                exec("chmod ug+x .husky/*", () => {
                    message.success({text: "Husky created"});
                });
            }
        );
    });
}

export async function init() {
    await whichFramework();
    await supportTailwind();
    await supportTypeScript();
    await whichPackageManager();

    removeOldFiles();
    installPackages();
}
