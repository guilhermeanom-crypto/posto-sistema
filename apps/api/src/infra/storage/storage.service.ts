import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from '../../config/env.js'

// ─────────────────────────────────────────────────────────────────────────────
// StorageService — abstração sobre S3/MinIO
// ─────────────────────────────────────────────────────────────────────────────

const s3Client = new S3Client({
  region: env.S3_REGION,
  ...(env.S3_ENDPOINT ? { endpoint: env.S3_ENDPOINT, forcePathStyle: true } : {}),
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
})

export interface PresignedUploadResult {
  uploadUrl: string
  chaveS3: string
  expiraEm: Date
}

export class StorageService {
  private readonly bucket = env.S3_BUCKET
  private readonly expiresIn = env.PRESIGNED_URL_EXPIRES_SECONDS

  /**
   * Gera uma URL pré-assinada para upload direto (client → S3).
   * O arquivo vai direto para o S3 sem passar pela API.
   */
  async gerarUrlUpload(
    chaveS3: string,
    mimeType: string,
    tamanhoMaximoBytes?: number,
  ): Promise<PresignedUploadResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: chaveS3,
      ContentType: mimeType,
      ...(tamanhoMaximoBytes ? { ContentLength: tamanhoMaximoBytes } : {}),
    })

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: this.expiresIn,
    })

    const expiraEm = new Date(Date.now() + this.expiresIn * 1000)

    return { uploadUrl, chaveS3, expiraEm }
  }

  /**
   * Gera uma URL pré-assinada para download seguro (expira em N segundos).
   */
  async gerarUrlDownload(chaveS3: string, expiresInSeconds?: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: chaveS3,
    })

    return getSignedUrl(s3Client, command, {
      expiresIn: expiresInSeconds ?? 300, // 5 min padrão para downloads
    })
  }

  /**
   * Verifica se um objeto existe no S3 e retorna seus metadados.
   */
  async verificarArquivo(
    chaveS3: string,
  ): Promise<{ existe: boolean; tamanhoBytes?: number; contentType?: string }> {
    try {
      const result = await s3Client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: chaveS3 }),
      )
      return {
        existe: true,
        tamanhoBytes: result.ContentLength,
        contentType: result.ContentType,
      }
    } catch {
      return { existe: false }
    }
  }

  /**
   * Remove um objeto do S3 (apenas para limpeza de uploads falhos).
   */
  async removerArquivo(chaveS3: string): Promise<void> {
    await s3Client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: chaveS3 }),
    )
  }

  /**
   * Gera a chave S3 padrão para um arquivo de documento.
   * Formato: {tenantId}/documentos/{documentoId}/{versaoId}_{nomeArquivo}
   */
  static gerarChaveDocumento(
    tenantId: string,
    documentoId: string,
    versaoId: string,
    nomeArquivo: string,
  ): string {
    const ext = nomeArquivo.split('.').pop() ?? 'pdf'
    return `${tenantId}/documentos/${documentoId}/${versaoId}.${ext}`
  }

  /**
   * Gera a chave S3 para arquivos temporários (limpeza automática em 24h).
   */
  static gerarChaveTemporaria(sessionId: string, nomeArquivo: string): string {
    return `temporario/${sessionId}/${nomeArquivo}`
  }
}

export const storageService = new StorageService()
