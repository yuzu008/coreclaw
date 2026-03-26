export function parseDirtyTrackedFiles(statusOutput: string): string[] {
  const files = new Set<string>();

  for (const rawLine of statusOutput.split('\n')) {
    const line = rawLine.trimEnd();
    if (!line) continue;

    const status = line.slice(0, 2);
    if (status === '??') continue;

    const pathPart = line.slice(3).trim();
    if (!pathPart) continue;

    const filePath = pathPart.includes(' -> ')
      ? pathPart.split(' -> ').pop() || pathPart
      : pathPart;

    files.add(filePath);
  }

  return [...files].sort();
}

export function classifyUpdaterDirtyFiles(files: string[]): { autoClean: string[]; blocking: string[] } {
  const autoCleanable = new Set([
    'package-lock.json',
  ]);

  const autoClean: string[] = [];
  const blocking: string[] = [];

  for (const file of files) {
    if (autoCleanable.has(file)) autoClean.push(file);
    else blocking.push(file);
  }

  return { autoClean, blocking };
}