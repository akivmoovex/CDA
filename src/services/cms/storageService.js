import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  STORAGE_BUCKETS,
  buildStoragePath,
  isPublicStorageBucket,
} from '../../config/storageBuckets.js';
import { getSupabaseAdminClient } from '../../config/supabase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../..');
const localPublicUploadRoot = path.join(projectRoot, 'public', 'uploads');
const localPrivateUploadRoot = path.join(projectRoot, '.data', 'uploads');

function extensionFor(file) {
  return path.extname(file.originalname || '').toLowerCase() || '.bin';
}

function localPathFor(bucket, storagePath) {
  const root = isPublicStorageBucket(bucket) ? localPublicUploadRoot : localPrivateUploadRoot;
  return path.join(root, bucket, storagePath);
}

function localPublicUrl(bucket, storagePath) {
  return `/uploads/${bucket}/${storagePath.split('/').map(encodeURIComponent).join('/')}`;
}

export function parseStoredFileUrl(fileUrl) {
  if (!fileUrl) {
    return null;
  }

  if (fileUrl.startsWith('/uploads/')) {
    const parts = fileUrl.replace(/^\/uploads\//, '').split('/');
    const bucket = parts.shift();
    return { bucket, storagePath: parts.map(decodeURIComponent).join('/') };
  }

  for (const bucket of Object.values(STORAGE_BUCKETS)) {
    const marker = `/object/public/${bucket}/`;
    const privateMarker = `/object/sign/${bucket}/`;
    const authenticatedMarker = `/object/authenticated/${bucket}/`;

    for (const prefix of [marker, privateMarker, authenticatedMarker]) {
      if (fileUrl.includes(prefix)) {
        return {
          bucket,
          storagePath: decodeURIComponent(fileUrl.split(prefix)[1]?.split('?')[0] || ''),
        };
      }
    }
  }

  return null;
}

export async function getPublicFileUrl(bucket, storagePath) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return localPublicUrl(bucket, storagePath);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function getSignedFileUrl(bucket, storagePath, expiresIn = 3600) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return `/admin/media/files/local?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(storagePath)}`;
  }

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(storagePath, expiresIn);
  if (error) {
    throw error;
  }
  return data.signedUrl;
}

export async function getFileAccessUrl({ bucket, storagePath, fileUrl }) {
  const resolvedBucket = bucket ?? parseStoredFileUrl(fileUrl)?.bucket;
  const resolvedPath = storagePath ?? parseStoredFileUrl(fileUrl)?.storagePath;

  if (!resolvedBucket || !resolvedPath) {
    return fileUrl ?? null;
  }

  if (isPublicStorageBucket(resolvedBucket)) {
    return getPublicFileUrl(resolvedBucket, resolvedPath);
  }

  return getSignedFileUrl(resolvedBucket, resolvedPath);
}

export async function uploadTenantFile({ tenantSlug, folder, file, bucket = STORAGE_BUCKETS.TENANT_MEDIA }) {
  if (!file) {
    return null;
  }

  if (!tenantSlug) {
    throw new Error('tenantSlug is required for storage uploads.');
  }

  const filename = `${crypto.randomUUID()}${extensionFor(file)}`;
  const storagePath = buildStoragePath(tenantSlug, folder, filename);

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    const { error } = await supabase.storage.from(bucket).upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

    if (error) {
      throw error;
    }
  } else {
    const targetPath = localPathFor(bucket, storagePath);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, file.buffer);
  }

  const url = isPublicStorageBucket(bucket)
    ? await getPublicFileUrl(bucket, storagePath)
    : null;

  return {
    url,
    bucket,
    storagePath,
    mimeType: file.mimetype,
    isPrivate: !isPublicStorageBucket(bucket),
  };
}

export async function copyStoredFile({
  tenantSlug,
  sourceBucket,
  sourcePath,
  targetBucket,
  targetFolder,
  filename,
  mimeType,
}) {
  const targetFilename = filename ?? path.basename(sourcePath);
  const targetPath = buildStoragePath(tenantSlug, targetFolder, targetFilename);
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    const from = localPathFor(sourceBucket, sourcePath);
    const to = localPathFor(targetBucket, targetPath);
    await fs.mkdir(path.dirname(to), { recursive: true });
    await fs.copyFile(from, to);
  } else {
    const { data, error } = await supabase.storage.from(sourceBucket).download(sourcePath);
    if (error) {
      throw error;
    }
    const buffer = Buffer.from(await data.arrayBuffer());
    const { error: uploadError } = await supabase.storage.from(targetBucket).upload(targetPath, buffer, {
      contentType: mimeType,
      upsert: true,
    });
    if (uploadError) {
      throw uploadError;
    }
  }

  const url = isPublicStorageBucket(targetBucket) ? await getPublicFileUrl(targetBucket, targetPath) : null;

  return {
    url,
    bucket: targetBucket,
    storagePath: targetPath,
    isPrivate: !isPublicStorageBucket(targetBucket),
  };
}

export async function promoteToPublicTenantMedia({ tenantSlug, sourceBucket, sourcePath, targetFolder, mimeType }) {
  if (sourceBucket === STORAGE_BUCKETS.TENANT_MEDIA) {
    return {
      url: await getPublicFileUrl(sourceBucket, sourcePath),
      bucket: sourceBucket,
      storagePath: sourcePath,
      isPrivate: false,
    };
  }

  const copied = await copyStoredFile({
    tenantSlug,
    sourceBucket,
    sourcePath,
    targetBucket: STORAGE_BUCKETS.TENANT_MEDIA,
    targetFolder,
    mimeType,
  });

  await deleteStoredFile({ bucket: sourceBucket, storagePath: sourcePath });
  return copied;
}

export async function deleteStoredFile({ bucket, storagePath, fileUrl }) {
  const parsed = fileUrl ? parseStoredFileUrl(fileUrl) : null;
  const resolvedBucket = bucket ?? parsed?.bucket;
  const resolvedPath = storagePath ?? parsed?.storagePath;

  if (!resolvedBucket || !resolvedPath) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    await supabase.storage.from(resolvedBucket).remove([resolvedPath]);
    return;
  }

  try {
    await fs.unlink(localPathFor(resolvedBucket, resolvedPath));
  } catch {
    // ignore missing local files
  }
}

/** @deprecated Use deleteStoredFile */
export async function deleteTenantFileByUrl(fileUrl) {
  return deleteStoredFile({ fileUrl });
}

export async function readLocalPrivateFile(bucket, storagePath) {
  return fs.readFile(localPathFor(bucket, storagePath));
}

export default {
  parseStoredFileUrl,
  getPublicFileUrl,
  getSignedFileUrl,
  getFileAccessUrl,
  uploadTenantFile,
  copyStoredFile,
  promoteToPublicTenantMedia,
  deleteStoredFile,
  deleteTenantFileByUrl,
  readLocalPrivateFile,
};
