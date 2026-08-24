// Why: Zed's Antigravity ACP host runs hook commands with `shlex.split` + `create_subprocess_exec`,
// so the installed string is tokenized and then exec'd directly — no shell. This mirrors that
// tokenizer (POSIX mode: no expansion inside single quotes, backslash escapes outside them) so tests
// can exercise the exec path instead of the `/bin/sh -c` path they would otherwise take.
export function shlexSplit(command: string): string[] {
  const tokens: string[] = []
  let current = ''
  let started = false
  let quote: '"' | "'" | null = null
  for (let index = 0; index < command.length; index += 1) {
    const char = command[index]
    if (char === '\\' && quote !== "'") {
      const next = command[index + 1]
      if (next !== undefined) {
        current += next
        started = true
        index += 1
        continue
      }
    }
    if (quote === null && (char === '"' || char === "'")) {
      quote = char
      started = true
      continue
    }
    if (quote === char) {
      quote = null
      continue
    }
    if (quote === null && /\s/.test(char)) {
      if (started) {
        tokens.push(current)
        current = ''
        started = false
      }
      continue
    }
    current += char
    started = true
  }
  if (started) {
    tokens.push(current)
  }
  return tokens
}

// Why: POSIX Antigravity commands are handed to `/bin/sh -c` so they stay exec-spawnable (#16087);
// assertions about the shell snippet itself read the payload back out instead of matching its escaping.
export function posixHookInnerCommand(command: string): string {
  const argv = shlexSplit(command)
  return argv[0] === '/bin/sh' && argv[1] === '-c' && argv[2] !== undefined ? argv[2] : command
}
