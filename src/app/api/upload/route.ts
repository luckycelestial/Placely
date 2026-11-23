import { NextRequest, NextResponse } from 'next/server';
import { R2_LIMITS, StorageCategory, uploadBufferToR2, deleteFileFromR2, getR2SignedDownloadUrl } from '@/lib/r2';
import { getAuthenticatedUser } from '@/lib/auth-server';

export const runtime = 'nodejs';

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);

    // Strict authentication: Valid session or identity required for all uploads
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required to upload files.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const categoryRaw = (formData.get('category') as string) || 'document';
    let identifier = (formData.get('identifier') as string) || '';
    const docTitle = (formData.get('docTitle') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Ownership check: If student, restrict identifier to their own student/user ID
    if (authUser && authUser.role === 'student') {
      const allowedId = categoryRaw === 'avatar' ? authUser.id : (authUser.studentId || authUser.id);
      identifier = allowedId;
    } else if (!identifier) {
      identifier = authUser?.id || 'anonymous';
    }

    const category = (categoryRaw in R2_LIMITS ? categoryRaw : 'document') as StorageCategory;
    const limits = R2_LIMITS[category];

    // Enforce strict file size limit
    if (file.size > limits.maxBytes) {
      const maxMb = Math.round(limits.maxBytes / (1024 * 1024));
      return NextResponse.json(
        {
          error: `File size exceeds the allowed limit for ${category}. Maximum allowed is ${maxMb}MB.`,
          maxBytes: limits.maxBytes,
          fileSize: file.size,
        },
        { status: 413 }
      );
    }

    // Enforce allowed MIME types
    const fileType = file.type || 'application/octet-stream';
    const isAllowedMime = (limits.allowedMimeTypes as readonly string[]).includes(fileType);

    // Fallback: Check extension if MIME type is generic
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const safeExtMap: Record<string, string> = {
      pdf: 'application/pdf',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    if (!isAllowedMime && (!ext || !safeExtMap[ext] || !(limits.allowedMimeTypes as readonly string[]).includes(safeExtMap[ext]))) {
      return NextResponse.json(
        {
          error: `Invalid file type. Allowed formats for ${category}: ${limits.label}`,
          allowedTypes: limits.allowedMimeTypes,
          receivedType: fileType,
        },
        { status: 415 }
      );
    }

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Deterministic key structure to prevent unbounded file accumulation & traversal
    const cleanId = sanitizeFilename(identifier).replace(/^[._]+|[._]+$/g, '');
    const resolvedExt = ext || (fileType.includes('pdf') ? 'pdf' : 'png');
    let key: string;

    if (category === 'avatar') {
      key = `avatars/${cleanId}/avatar.${resolvedExt}`;
    } else if (category === 'resume') {
      key = `resumes/${cleanId}/resume.${resolvedExt}`;
    } else {
      const cleanTitle = sanitizeFilename(docTitle || 'doc');
      key = `documents/${cleanId}/${cleanTitle}-${Date.now()}.${resolvedExt}`;
    }

    const { url } = await uploadBufferToR2({
      key,
      buffer,
      contentType: fileType || safeExtMap[ext] || 'application/octet-stream',
    });

    return NextResponse.json({
      success: true,
      url,
      key,
      filename: file.name,
      size: file.size,
      category,
    });
  } catch (error: any) {
    console.error('R2 Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file to Cloudflare R2' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);

    // Strict authentication: Identity or active session required to delete storage objects
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Missing file key' }, { status: 400 });
    }

    // Strict path traversal and prefix sanitization
    if (key.includes('..') || key.includes('\\') || key.startsWith('/') || key.includes('\0')) {
      return NextResponse.json({ error: 'Invalid key path format' }, { status: 400 });
    }

    // Authorization check: If caller is student, they may only delete files in their own folder
    if (authUser && authUser.role === 'student') {
      const studentId = authUser.studentId || authUser.id;
      const userFolder = `/${studentId}/`;
      const isOwner = key.includes(userFolder) || key.startsWith(`avatars/${authUser.id}/`) || key.startsWith(`resumes/${studentId}/`);
      if (!isOwner) {
        return NextResponse.json({ error: 'Forbidden: You do not have permission to delete this file.' }, { status: 403 });
      }
    }

    const deleted = await deleteFileFromR2(key);
    if (!deleted) {
      return NextResponse.json({ error: 'Could not delete object from R2' }, { status: 500 });
    }

    return NextResponse.json({ success: true, key });
  } catch (error: any) {
    console.error('R2 Delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete file from Cloudflare R2' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Missing file key' }, { status: 400 });
    }

    if (key.includes('..') || key.includes('\\') || key.startsWith('/') || key.includes('\0')) {
      return NextResponse.json({ error: 'Invalid key path format' }, { status: 400 });
    }

    // Authorization: Students can only access their own documents/resumes/avatars
    if (authUser.role === 'student') {
      const studentId = authUser.studentId || authUser.id;
      const isOwner =
        key.startsWith(`resumes/${studentId}/`) ||
        key.startsWith(`avatars/${authUser.id}/`) ||
        key.startsWith(`documents/${studentId}/`);

      if (!isOwner) {
        return NextResponse.json({ error: 'Forbidden: You cannot access other students private documents' }, { status: 403 });
      }
    }

    const signedUrl = await getR2SignedDownloadUrl(key, 900);
    return NextResponse.json({ ok: true, key, url: signedUrl, expiresIn: 900 });
  } catch (error: any) {
    console.error('R2 Pre-signed URL error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate presigned download URL' },
      { status: 500 }
    );
  }
}
