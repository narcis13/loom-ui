const ANSI = {
  reset: "\u001b[0m",
  blue: "\u001b[34m",
  green: "\u001b[32m",
  yellow: "\u001b[33m",
  red: "\u001b[31m",
};

function log(color: string, label: string, message: string): void {
  console.log(`${color}${label}${ANSI.reset} ${message}`);
}

export function info(message: string): void {
  log(ANSI.blue, "info", message);
}

export function success(message: string): void {
  log(ANSI.green, "ok", message);
}

export function warn(message: string): void {
  log(ANSI.yellow, "warn", message);
}

export function error(message: string): void {
  log(ANSI.red, "err", message);
}
