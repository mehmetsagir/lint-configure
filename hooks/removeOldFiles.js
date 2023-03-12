import { createSpinner } from "nanospinner";
import { exec } from "child_process";

export function removeOldFiles() {
  const message = createSpinner("Removing old files...").start();

  exec(
    "rm -rf .husky lint-staged.config.js .prettirrc .prettierrc.json .prettierrc.js .eslintrc.js .eslintrc.json .eslintrc .vscode",
    (err) => {
      if (err) {
        message.error({ text: "Error removing old files" });
        return;
      }
      message.success({ text: "Old files removed" });
    }
  );
}
