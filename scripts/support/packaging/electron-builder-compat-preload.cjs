const childProcess = require("node:child_process");
const {
  LogMessageByKey,
  logMessageLevelByKey
} = require("app-builder-lib/out/node-module-collector/moduleManager.js");

const installKey = Symbol.for("onlyspeech.electronBuilderCompatInstalled");

if (!globalThis[installKey]) {
  globalThis[installKey] = true;

  if (process.platform === "win32") {
    const originalSpawn = childProcess.spawn;
    const quotedCommandPattern = /^"(.*)"$/;

    childProcess.spawn = function patchedSpawn(command, args, options) {
      if (
        options &&
        options.shell === true &&
        typeof command === "string" &&
        command.toLowerCase() === "cmd.exe" &&
        Array.isArray(args) &&
        args[0] === "/c"
      ) {
        const normalizedArgs = [...args];
        if (typeof normalizedArgs[1] === "string") {
          const quotedCommandMatch = quotedCommandPattern.exec(normalizedArgs[1]);
          if (quotedCommandMatch) {
            normalizedArgs[1] = quotedCommandMatch[1];
          }
        }

        return originalSpawn.call(this, command, normalizedArgs, {
          ...options,
          shell: false
        });
      }

      return originalSpawn.call(this, command, args, options);
    };
  }

  // npm's collector uses duplicate-reference entries for normal pointer nodes.
  logMessageLevelByKey[LogMessageByKey.PKG_DUPLICATE_REF] = "debug";
}
