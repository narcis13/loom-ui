#!/usr/bin/env bun

import { doctorCommand } from "./commands/doctor";
import { initCommand } from "./commands/init";
import { error, info } from "./utils/logger";

export async function runCli(args = process.argv.slice(2), cwd = process.cwd()): Promise<number> {
  try {
    const [command, ...rest] = args;

    if (!command || command === "help" || command === "--help" || command === "-h") {
      printHelp();
      return 0;
    }

    if (command === "--version" || command === "-v") {
      info("loom 1.0.0");
      return 0;
    }

    if (command === "init") {
      await initCommand(rest, cwd);
      return 0;
    }

    if (command === "doctor") {
      return (await doctorCommand(rest, cwd)).ok ? 0 : 1;
    }

    error(`Unknown command: ${command}`);
    printHelp();
    return 1;
  } catch (caught) {
    error(caught instanceof Error ? caught.message : String(caught));
    return 1;
  }
}

function printHelp(): void {
  info("Usage: loom <command> [options]");
  info("");
  info("Commands:");
  info("  init      Initialize a Loom project");
  info("  doctor    Check project health");
}

if (import.meta.main) {
  const exitCode = await runCli();
  process.exit(exitCode);
}
