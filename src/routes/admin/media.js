import { Router } from 'express';
import multer from 'multer';
import { STORAGE_BUCKETS } from '../../config/storageBuckets.js';
import {
  approvalStatusBadge,
  approveMedia,
  canApproveMedia,
  consentStatusBadge,
  createMediaAsset,
  deleteMediaAsset,
  enrichMediaAssetForAdmin,
  getMediaAsset,
  getMediaStats,
  inferMediaKind,
  listMediaAssets,
  listMediaAuditLog,
  recordMediaConsent,
  rejectMedia,
  requestMediaChanges,
  submitMediaForReview,
  updateMediaAsset,
} from '../../services/media/index.js';
import { readLocalPrivateFile, uploadTenantFile } from '../../services/cms/storageService.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

function formatRelativeTime(isoDate) {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function mediaKindMeta(kind) {
  const map = {
    photo: { icon: 'image', label: 'PHOTO', tone: 'secondary' },
    video: { icon: 'videocam', label: 'VIDEO', tone: 'tertiary' },
    document: { icon: 'article', label: 'DOCUMENT', tone: 'primary' },
  };
  return map[kind] ?? map.photo;
}

function buildMediaTableRow(asset) {
  const gate = canApproveMedia(asset);
  const isImage = asset.media_kind === 'photo' || (asset.mime_type ?? '').startsWith('image/');
  const previewUrl = asset.access_url || asset.file_url;

  return {
    item: {
      title: asset.title,
      subtitle: `Uploaded by ${asset.uploaded_by ?? 'Staff'} • ${formatRelativeTime(asset.created_at)}`,
      image: isImage ? previewUrl : null,
      document: asset.media_kind === 'document',
      video: asset.media_kind === 'video',
    },
    type: {
      ...mediaKindMeta(asset.media_kind),
      tags: (asset.tags ?? []).map((tag) => String(tag).toUpperCase()),
    },
    status: consentStatusBadge(asset.consent_status),
    approval: approvalStatusBadge(asset.approval_status),
    actions: {
      editHref: `/admin/media/${asset.id}`,
      approveAction: `/admin/media/${asset.id}/approve`,
      rejectAction: `/admin/media/${asset.id}/reject`,
      disabled: !gate.ok,
      showApprove: ['private', 'pending_review', 'changes_requested'].includes(asset.approval_status),
    },
  };
}

export function createMediaRouter() {
  const router = Router();

  router.get('/files/local', async (req, res, next) => {
    try {
      const bucket = req.query.bucket;
      const storagePath = req.query.path;
      if (bucket !== STORAGE_BUCKETS.PRIVATE_DOCUMENTS || !storagePath) {
        return res.status(403).send('Forbidden');
      }

      const buffer = await readLocalPrivateFile(bucket, storagePath);
      res.type(req.query.mime || 'application/octet-stream').send(buffer);
    } catch (error) {
      next(error);
    }
  });

  router.get('/', async (req, res, next) => {
    try {
      const filters = {
        approvalStatus: req.query.approval || undefined,
        mediaKind: req.query.kind || undefined,
        childRelated: req.query.child === '1' ? true : undefined,
      };
      const assets = await listMediaAssets(req.tenant.id, filters);
      const stats = await getMediaStats(req.tenant.id);
      const enrichedAssets = await Promise.all(assets.map((asset) => enrichMediaAssetForAdmin(asset)));

      res.render('admin/media/index', {
        layout: 'layouts/admin',
        title: 'Media Approval',
        pageTitle: 'Media Approval Queue',
        stats,
        filters,
        mediaTableColumns: [
          { key: 'item', label: 'Media Item' },
          { key: 'type', label: 'Type & Tags' },
          { key: 'status', label: 'Consent Status' },
          { key: 'approval', label: 'Approval Status' },
          { key: 'actions', label: 'Actions', align: 'right' },
        ],
        mediaTableRows: enrichedAssets.map(buildMediaTableRow),
        flash: req.query.flash,
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/new', (req, res) => {
    res.render('admin/media/form', {
      layout: 'layouts/admin',
      title: 'Upload Media',
      pageTitle: 'Upload Media',
    });
  });

  router.post('/', upload.single('file'), async (req, res, next) => {
    try {
      if (!req.file) {
        const err = new Error('Media file is required.');
        err.status = 400;
        err.expose = true;
        throw err;
      }

      const fileUrl = await uploadTenantFile({
        tenantSlug: req.tenant.slug,
        folder: 'media/pending',
        file: req.file,
        bucket: STORAGE_BUCKETS.PRIVATE_DOCUMENTS,
      });

      const isChildRelated = req.body.is_child_related === 'true';
      const tags = String(req.body.tags || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      await createMediaAsset(
        req.tenant.id,
        {
          title: req.body.title?.trim() || req.file.originalname,
          description: req.body.description?.trim() || null,
          file_url: fileUrl.url ?? '',
          storage_bucket: fileUrl.bucket,
          storage_path: fileUrl.storagePath,
          mime_type: req.file.mimetype,
          media_kind: inferMediaKind(req.file.mimetype),
          tags,
          is_child_related: isChildRelated,
          consent_status: req.body.consent_status || undefined,
          approval_status: req.body.submit_review === 'true' || isChildRelated ? 'pending_review' : 'private',
        },
        req.user,
      );

      res.redirect('/admin/media?flash=uploaded');
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const asset = await getMediaAsset(req.tenant.id, req.params.id);
      if (!asset) {
        return res.status(404).render('errors/404', {
          layout: 'layouts/error',
          title: 'Not Found',
          message: 'Media asset not found.',
        });
      }

      const enrichedAsset = await enrichMediaAssetForAdmin(asset);
      const auditLog = await listMediaAuditLog(req.tenant.id, asset.id);
      const approveGate = canApproveMedia(asset);

      res.render('admin/media/detail', {
        layout: 'layouts/admin',
        title: asset.title,
        pageTitle: asset.title,
        asset: enrichedAsset,
        auditLog,
        consentBadge: consentStatusBadge(asset.consent_status),
        approvalBadge: approvalStatusBadge(asset.approval_status),
        canApprove: approveGate.ok,
        approveBlockReason: approveGate.reason,
        flash: req.query.flash,
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/:id', async (req, res, next) => {
    try {
      await updateMediaAsset(
        req.tenant.id,
        req.params.id,
        {
          title: req.body.title?.trim(),
          description: req.body.description?.trim() || null,
          is_child_related: req.body.is_child_related === 'true',
          tags: String(req.body.tags || '')
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
        },
        req.user,
      );
      res.redirect(`/admin/media/${req.params.id}?flash=updated`);
    } catch (error) {
      next(error);
    }
  });

  router.post('/:id/submit-review', async (req, res, next) => {
    try {
      await submitMediaForReview(req.tenant.id, req.params.id, req.user);
      res.redirect(`/admin/media/${req.params.id}?flash=submitted`);
    } catch (error) {
      next(error);
    }
  });

  router.post('/:id/consent', async (req, res, next) => {
    try {
      await recordMediaConsent(req.tenant.id, req.params.id, req.body.consent_status, req.user);
      res.redirect(`/admin/media/${req.params.id}?flash=consent`);
    } catch (error) {
      next(error);
    }
  });

  router.post('/:id/approve', async (req, res, next) => {
    try {
      await approveMedia(req.tenant.id, req.tenant.slug, req.params.id, req.body.reviewer_comments?.trim() || null, req.user);
      res.redirect(`/admin/media/${req.params.id}?flash=approved`);
    } catch (error) {
      next(error);
    }
  });

  router.post('/:id/reject', async (req, res, next) => {
    try {
      await rejectMedia(req.tenant.id, req.params.id, req.body.reviewer_comments?.trim() || null, req.user);
      res.redirect(`/admin/media/${req.params.id}?flash=rejected`);
    } catch (error) {
      next(error);
    }
  });

  router.post('/:id/request-changes', async (req, res, next) => {
    try {
      await requestMediaChanges(req.tenant.id, req.params.id, req.body.reviewer_comments?.trim() || null, req.user);
      res.redirect(`/admin/media/${req.params.id}?flash=changes_requested`);
    } catch (error) {
      next(error);
    }
  });

  router.post('/:id/delete', async (req, res, next) => {
    try {
      await deleteMediaAsset(req.tenant.id, req.params.id, req.user);
      res.redirect('/admin/media?flash=deleted');
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export default createMediaRouter;
