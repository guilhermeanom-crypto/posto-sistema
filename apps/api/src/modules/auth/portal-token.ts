import crypto from 'node:crypto'

export function gerarPortalToken() {
  return crypto.randomBytes(48).toString('base64url')
}

export function hashPortalToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}
