const TAG_REGEX = /#([0-9A-Za-z가-힣_]+)/g;

export function extractTags(content: string) {
  const tags = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = TAG_REGEX.exec(content)) !== null) {
    const tag = match[1]?.trim();
    if (tag) tags.add(tag);
  }

  return Array.from(tags);
}
