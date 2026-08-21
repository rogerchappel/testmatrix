export function splitCommand(commandLine: string): { command: string; args: string[] } {
  const tokens: string[] = [];
  let token = '';
  let quote: '"' | "'" | undefined;
  let escaped = false;
  let started = false;

  for (const character of commandLine) {
    if (escaped) {
      token += character;
      escaped = false;
      started = true;
    } else if (character === '\\' && quote !== "'") {
      escaped = true;
      started = true;
    } else if (quote) {
      if (character === quote) quote = undefined;
      else token += character;
    } else if (character === '"' || character === "'") {
      quote = character;
      started = true;
    } else if (/\s/.test(character)) {
      if (started) {
        tokens.push(token);
        token = '';
        started = false;
      }
    } else {
      token += character;
      started = true;
    }
  }

  if (escaped) {
    throw new Error('command ends with an unterminated escape');
  }
  if (quote) {
    throw new Error(`command has an unterminated ${quote === "'" ? 'single' : 'double'} quote`);
  }
  if (started) tokens.push(token);

  if (tokens.length === 0 || tokens[0] === '') {
    throw new Error('command is empty');
  }

  const [command, ...args] = tokens;
  return { command, args };
}
