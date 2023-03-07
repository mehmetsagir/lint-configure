export const eslintConfig = (supportTailwind = false) => {
  const config = {
    extends: ["next", "next/core-web-vitals", "prettier"],
    plugins: ["prettier", "simple-import-sort"],
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
    rules: {
      quotes: ["error", "double"],
      "prettier/prettier": "error",
      "no-console": "error",
      "simple-import-sort/imports": "error",
      "no-duplicate-imports": "error",
      "no-unused-vars": ["error", { args: "all", argsIgnorePattern: "^_" }],
      "no-duplicate-case": "error",
      "no-empty": "error",
      "no-use-before-define": "error",
      "class-methods-use-this": "error",
      "no-plusplus": ["error", { allowForLoopAfterthoughts: true }],
      "no-dupe-keys": "error",
      "no-dupe-args": "error",
      "no-case-declarations": "error",
    },
  };

  if (supportTailwind) {
    config.plugins.push("tailwindcss");

    Object.entries({
      "tailwindcss/classnames-order": "warn",
      "tailwindcss/enforces-negative-arbitrary-values": "warn",
      "tailwindcss/enforces-shorthand": "warn",
      "tailwindcss/migration-from-tailwind-2": "warn",
      "tailwindcss/no-arbitrary-value": "off",
      "tailwindcss/no-custom-classname": "warn",
      "tailwindcss/no-contradicting-classname": "error",
    }).forEach(([key, value]) => {
      config.rules[key] = value;
    });
  }

  return config;
};

export const prettierConfig = {
  semi: true,
  trailingComma: "none",
  singleQuote: false,
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  arrowParens: "avoid",
  proseWrap: "preserve",
  quoteProps: "as-needed",
  bracketSameLine: false,
  bracketSpacing: true,
};

export const vscodeSettings = {
  "editor.formatOnPaste": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
  },
};

export const lintStagedConfig = () => {
  return (
    "module.exports = {" +
    "  '**/*.(ts|tsx)': () => 'yarn tsc --noEmit'," +
    "  '**/*.(ts|tsx|js)': filenames => [" +
    "    `yarn eslint --fix ${filenames.join(' ')}`," +
    "    `yarn prettier --write ${filenames.join(' ')}`" +
    "  ]," +
    "  '**/*.(md|json)': filenames =>" +
    "    `yarn prettier --write ${filenames.join(' ')}`" +
    "};"
  );
};

export const huskyPreCommitConfig = (supportTypeScript = false) => {
  const typeCheck = `
echo "🔎 Checking validity of types with TypeScript"

yarn type-check || (
    '⛔️ There is a type error in the code, fix it, and try commit again. ⛔️';
    false;
)

echo '✅ No TypeError found'
`;

  return `
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo 'Running Git Hooks'
${supportTypeScript ? typeCheck : ""}
echo '🔎 Running linter..'

yarn lint || (
    echo '⛔️ There is a problem in the code. ⌛️ I run linter autofix for you.';

    echo '🔎 Running linter autofix..'
    
    yarn lint:fix || (
        echo '⛔️ Autofix failed. Please fix the linting errors manually. ⛔️';
        false;
    )

    echo '🧐 Please check the changes and commit again.'
    false;
)

echo '✅ No Eslint error found'
echo '⌛️ Running lint staged and git commit ⌛️'
`;
};
