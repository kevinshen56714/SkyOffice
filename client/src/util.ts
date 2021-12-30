export function sanitizeId(id: string) {
  let sanitized = id

  if (sanitized.length > 9 && sanitized.endsWith('-ss')) {
    sanitized = sanitized.substring(0, sanitized.length - 3)
  }

  return sanitized.replace(/[^0-9a-z]/gi, 'G')
}

const colorArr = [
  '#7bf1a8',
  '#ff7e50',
  '#9acd32',
  '#daa520',
  '#ff69b4',
  '#c085f6',
  '#1e90ff',
  '#5f9da0',
]

// determine name color by first character charCode
export function getColorByString(string: string) {
  return colorArr[Math.floor(string.charCodeAt(0) % colorArr.length)]
}

export function getAvatarString(name: string) {
  const part = name.split(' ')
  return part.length < 2 ? part[0][0] : part[0][0] + part[1][0]
}
