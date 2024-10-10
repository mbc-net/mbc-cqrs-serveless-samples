import { KEY_SEPARATOR } from '@mbc-cqrs-serverless/core'
import { ulid } from 'ulid'

export const TODO_PK_PREFIX = 'TODO'

export function generateTodoPk(tenantCode: string): string {
  return `${TODO_PK_PREFIX}${KEY_SEPARATOR}${tenantCode}`
}

export function generateTodoSk(): string {
  return ulid()
}

export function parsePk(pk: string): { type: string; tenantCode: string } {
  if (pk.split(KEY_SEPARATOR).length !== 2) {
    throw new Error('Invalid PK')
  }
  const [type, tenantCode] = pk.split(KEY_SEPARATOR)
  return {
    type,
    tenantCode,
  }
}
