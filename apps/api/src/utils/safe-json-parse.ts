const extractObject = (value: string): string | null => {
  let start = -1,
    depth = 0,
    quoted = false,
    escaped = false;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') quoted = false;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === '{') {
      if (start < 0) start = index;
      depth += 1;
    } else if (char === '}' && start >= 0) {
      depth -= 1;
      if (depth === 0) return value.slice(start, index + 1);
    }
  }
  return null;
};
export const safeJsonParse = <T>(value: string): T | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  for (const candidate of [unfenced, extractObject(unfenced)]) {
    if (!candidate) continue;
    try {
      return JSON.parse(candidate) as T;
    } catch {
      /* try extracted object */
    }
  }
  return null;
};
