import { Router } from 'express';
import multer from 'multer';
import { cmsEntityConfigs } from '../../config/cmsEntities.js';
import { bucketForCmsUpload, folderForCmsUpload } from '../../config/storageBuckets.js';
import { parseCmsFormBody, serializeRecordForForm } from '../../lib/cmsFormParser.js';
import { cmsRepositories } from '../../services/cms/index.js';
import { uploadTenantFile } from '../../services/cms/storageService.js';
import {
  assertGalleryPublishable,
  createMediaAsset,
  inferMediaKind,
  linkMediaToGalleryItem,
  submitMediaForReview,
} from '../../services/media/index.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

function getRepo(config) {
  return cmsRepositories[config.key];
}

function renderList(res, config, items, flash) {
  return res.render('admin/cms/list', {
    layout: 'layouts/admin',
    title: config.label,
    pageTitle: config.label,
    config,
    items,
    flash,
    topbarAction: { label: `New ${config.singular}`, href: `${config.adminBase}/new` },
  });
}

function renderForm(res, config, record, flash) {
  return res.render('admin/cms/form', {
    layout: 'layouts/admin',
    title: record?.id ? `Edit ${config.singular}` : `New ${config.singular}`,
    pageTitle: record?.id ? `Edit ${config.singular}` : `New ${config.singular}`,
    config,
    record,
    values: serializeRecordForForm(record, config),
    flash,
  });
}

async function applyUploads(req, config, payload) {
  req.cmsUploadResults = req.cmsUploadResults ?? {};

  for (const uploadConfig of config.uploads ?? []) {
    const file = req.files?.[uploadConfig.field]?.[0];
    if (!file) {
      continue;
    }

    const isChildRelated = config.key === 'gallery' && req.body.is_child_related === 'true';
    const bucket = bucketForCmsUpload(uploadConfig, { isChildRelated });
    const folder = folderForCmsUpload(uploadConfig, { isChildRelated });
    const result = await uploadTenantFile({
      tenantSlug: req.tenant.slug,
      folder,
      file,
      bucket,
    });

    req.cmsUploadResults[uploadConfig.field] = result;
    payload[uploadConfig.target] = result.isPrivate ? null : result.url;
  }

  return payload;
}

async function registerGalleryMediaAsset(req, config, record, payload) {
  if (config.key !== 'gallery') {
    return record;
  }

  const upload = req.cmsUploadResults?.image;
  if (!upload) {
    return record;
  }

  const imageFile = req.files?.image?.[0];
  const isChildRelated = req.body.is_child_related === 'true';
  const consentStatus = req.body.consent_status || undefined;

  const asset = await createMediaAsset(
    req.tenant.id,
    {
      title: record.title,
      file_url: upload.url ?? '',
      storage_bucket: upload.bucket,
      storage_path: upload.storagePath,
      mime_type: imageFile?.mimetype ?? upload.mimeType ?? null,
      media_kind: inferMediaKind(imageFile?.mimetype ?? upload.mimeType),
      is_child_related: isChildRelated,
      consent_status: consentStatus,
      gallery_item_id: record.id,
    },
    req.user,
  );

  const repo = getRepo(config);
  const updated = await repo.update(
    req.tenant.id,
    record.id,
    {
      media_asset_id: asset.id,
      image_url: upload.isPrivate ? null : upload.url,
      status: isChildRelated ? 'draft' : record.status,
    },
    req.user,
  );

  await linkMediaToGalleryItem(req.tenant.id, asset.id, record.id, req.user);

  if (req.body.submit_for_review === 'true' && !isChildRelated) {
    await submitMediaForReview(req.tenant.id, asset.id, req.user);
  }

  return updated ?? record;
}

export function createCmsEntityRouter(config) {
  const router = Router();
  const repo = getRepo(config);
  const uploadFields = (config.uploads ?? []).map((item) => ({ name: item.field, maxCount: 1 }));
  const uploadMiddleware = uploadFields.length ? upload.fields(uploadFields) : upload.none();

  router.get('/', async (req, res, next) => {
    try {
      const items = await repo.list(req.tenant.id);
      renderList(res, config, items, req.query.flash);
    } catch (error) {
      next(error);
    }
  });

  router.get('/new', (req, res) => {
    renderForm(res, config, null);
  });

  router.get('/:id/edit', async (req, res, next) => {
    try {
      const record = await repo.getById(req.tenant.id, req.params.id);
      if (!record) {
        return res.status(404).render('errors/404', {
          layout: 'layouts/error',
          title: 'Not Found',
          message: `${config.singular} not found.`,
        });
      }
      renderForm(res, config, record);
    } catch (error) {
      next(error);
    }
  });

  router.post('/', uploadMiddleware, async (req, res, next) => {
    try {
      let payload = parseCmsFormBody(req.body, config);
      payload = await applyUploads(req, config, payload);
      if (config.key === 'gallery' && req.body.is_child_related === 'true') {
        payload.status = 'draft';
      }
      let record = await repo.create(req.tenant.id, payload, req.user);
      if (config.key === 'gallery' && req.cmsUploadResults?.image) {
        record = await registerGalleryMediaAsset(req, config, record, payload);
      }
      res.redirect(`${config.adminBase}/${record.id}/edit?flash=created`);
    } catch (error) {
      next(error);
    }
  });

  router.post('/:id', uploadMiddleware, async (req, res, next) => {
    try {
      let payload = parseCmsFormBody(req.body, config);
      payload = await applyUploads(req, config, payload);
      if (config.key === 'gallery' && req.body.is_child_related === 'true') {
        payload.status = 'draft';
      }
      await repo.update(req.tenant.id, req.params.id, payload, req.user);
      if (config.key === 'gallery' && req.cmsUploadResults?.image) {
        const record = await repo.getById(req.tenant.id, req.params.id);
        await registerGalleryMediaAsset(req, config, record, payload);
      }
      res.redirect(`${config.adminBase}/${req.params.id}/edit?flash=updated`);
    } catch (error) {
      next(error);
    }
  });

  router.post('/:id/delete', async (req, res, next) => {
    try {
      await repo.remove(req.tenant.id, req.params.id, req.user);
      res.redirect(`${config.adminBase}?flash=deleted`);
    } catch (error) {
      next(error);
    }
  });

  router.post('/:id/publish', async (req, res, next) => {
    try {
      if (config.key === 'gallery') {
        const record = await repo.getById(req.tenant.id, req.params.id);
        await assertGalleryPublishable(req.tenant.id, record);
      }
      await repo.publish(req.tenant.id, req.params.id, req.user);
      res.redirect(`${config.adminBase}?flash=published`);
    } catch (error) {
      next(error);
    }
  });

  router.post('/:id/unpublish', async (req, res, next) => {
    try {
      await repo.unpublish(req.tenant.id, req.params.id, req.user);
      res.redirect(`${config.adminBase}?flash=unpublished`);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export function createCmsRouter() {
  const router = Router();

  router.get('/', (req, res) => {
    res.render('admin/cms/index', {
      layout: 'layouts/admin',
      title: 'Website Content',
      pageTitle: 'Website Content',
      entities: Object.values(cmsEntityConfigs),
    });
  });

  for (const config of Object.values(cmsEntityConfigs)) {
    router.use(`/${config.key}`, createCmsEntityRouter(config));
  }

  return router;
}

export default createCmsRouter;
