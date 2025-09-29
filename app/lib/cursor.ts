interface CursorData {
  timestamp: number
  id: string
}

export function encodeCursor(timestamp: number, id: string): string {
  const data: CursorData = { timestamp, id }
  return Buffer.from(JSON.stringify(data)).toString('base64')
}

export function decodeCursor(cursor: string): CursorData {
  const data = JSON.parse(Buffer.from(cursor, 'base64').toString())
  return data as CursorData
} 