import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Storage limits to prevent bucket exhaustion and abuse
export const R2_LIMITS = {
  avatar: {
    maxBytes: 2 * 1024 * 1024, // 2 MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    label: '2MB (JPEG, PNG, WebP)',
  },
  resume: {
    maxBytes: 5 * 1024 * 1024, // 5 MB
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    label: '5MB (PDF, DOC, DOCX)',
  },
  document: {
    maxBytes: 5 * 1024 * 1024, // 5 MB
    allowedMimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    label: '5MB (PDF, Images, DOC, DOCX)',
  },
} as const;

export type StorageCategory = keyof typeof R2_LIMITS;

let s3ClientInstance: S3Client | null = null;

export function getR2Client(): S3Client {
  if (s3ClientInstance) return s3ClientInstance;

  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Cloudflare R2 credentials (ACCOUNT_ID, ACCESS_KEY_ID, SECRET_ACCESS_KEY) are not configured.');
  }

  s3ClientInstance = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return s3ClientInstance;
}

export function getR2BucketName(): string {
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error('CLOUDFLARE_R2_BUCKET_NAME is not set.');
  }
  return bucket;
}

export function getR2PublicUrl(key: string): string {
  const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.CLOUDFLARE_R2_PUBLIC_URL;
  if (publicBase) {
    const trimmedBase = publicBase.replace(/\/+$/, '');
    const trimmedKey = key.replace(/^\/+/, '');
    return `${trimmedBase}/${trimmedKey}`;
  }
  // Fallback to S3 direct path or public r2 url format
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME;
  return `https://${bucket}.${accountId}.r2.cloudflarestorage.com/${key}`;
}

export async function uploadBufferToR2({
  key,
  buffer,
  contentType,
}: {
  key: string;
  buffer: Buffer;
  contentType: string;
}) {
  const client = getR2Client();
  const bucket = getR2BucketName();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return {
    key,
    url: getR2PublicUrl(key),
  };
}

export async function getR2SignedDownloadUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
  const client = getR2Client();
  const bucket = getR2BucketName();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

export async function deleteFileFromR2(key: string) {
  try {
    const client = getR2Client();
    const bucket = getR2BucketName();

    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
    return true;
  } catch (error) {
    console.error(`Failed to delete R2 file [${key}]:`, error);
    return false;
  }
}
