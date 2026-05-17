export function splitCommand(commandLine: string): { command: string; args: string[] } {
  const tokens = commandLine.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? [];
  const cleaned = tokens.map((token) => token.replace(/^(['"])(.*)\1$/, '$2'));
  const [command = '', ...args] = cleaned;
  return { command, args };
}
