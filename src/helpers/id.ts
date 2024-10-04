import { KEY_SEPARATOR } from '@mbc-cqrs-severless/core'
import { ulid } from 'ulid'

export const TASK_PK_PREFIX = 'TASK'

export function generateTaskPk(tenantCode: string): string {
  return `${TASK_PK_PREFIX}${KEY_SEPARATOR}${tenantCode}`
}

export function generateTaskSk(): string {
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
