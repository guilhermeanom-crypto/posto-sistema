import { S3Client } from '@aws-sdk/client-s3'
import { env } from '../config/env.js'

const s3ClientConfig = {
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
  ...(env.S3_ENDPOINT
    ? {
        endpoint: env.S3_ENDPOINT,
        forcePathStyle: true,
      }
    : {}),
}

export const s3 = new S3Client(s3ClientConfig)
