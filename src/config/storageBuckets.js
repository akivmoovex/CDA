export const STORAGE_BUCKETS = {
  TENANT_MEDIA: 'tenant-media',
  RESOURCES: 'resources',
  PRIVATE_DOCUMENTS: 'private-documents',
};

export const PUBLIC_STORAGE_BUCKETS = new Set([
  STORAGE_BUCKETS.TENANT_MEDIA,
  STORAGE_BUCKETS.RESOURCES,
]);

export function isPublicStorageBucket(bucket) {
  return PUBLIC_STORAGE_BUCKETS.has(bucket);
}

export function buildStoragePath(tenantSlug, folder, filename) {
  return `${tenantSlug}/${folder}/${filename}`;
}

export function bucketForCmsUpload(uploadConfig, { isChildRelated = false } = {}) {
  if (isChildRelated) {
    return STORAGE_BUCKETS.PRIVATE_DOCUMENTS;
  }
  return uploadConfig.bucket ?? STORAGE_BUCKETS.TENANT_MEDIA;
}

export function folderForCmsUpload(uploadConfig, { isChildRelated = false } = {}) {
  if (isChildRelated && uploadConfig.bucket !== STORAGE_BUCKETS.RESOURCES) {
    return `${uploadConfig.folder}/pending`;
  }
  return uploadConfig.folder;
}

export default {
  STORAGE_BUCKETS,
  PUBLIC_STORAGE_BUCKETS,
  isPublicStorageBucket,
  buildStoragePath,
  bucketForCmsUpload,
  folderForCmsUpload,
};
