/** 两种语言共用现有 Markdown 字段；老文章自动回退到原文。 */
const separator = '\n\n<!-- evanlink:en -->\n\n'

export function splitBody(raw: string) {
  const index = raw.indexOf(separator)
  return index < 0 ? { zh: raw, en: '' } : { zh: raw.slice(0, index), en: raw.slice(index + separator.length) }
}

export function combineBody(zh: string, en: string) {
  return en.trim() ? zh + separator + en : zh
}
