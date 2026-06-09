import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const loadLocalEnv = () => {
  for (const fileName of ['.env.local', '.env']) {
    const filePath = join(__dirname, fileName);
    if (!existsSync(filePath)) continue;

    const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;

      const separatorIndex = trimmed.indexOf('=');
      const key = trimmed.slice(0, separatorIndex).trim();
      const rawValue = trimmed.slice(separatorIndex + 1).trim();
      const value = rawValue.replace(/^['"]|['"]$/g, '');

      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
};

loadLocalEnv();

const app = express();
const port = process.env.PORT || 8080;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024
  }
});

app.use(express.json({ limit: '1mb' }));

const getCloudinaryConfig = () => {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;

  if (cloudinaryUrl) {
    const match = cloudinaryUrl.match(/^cloudinary:\/\/<?([^:>]+)>?:<?([^@>]+)>?@(.+)$/);
    if (match) {
      return {
        api_key: match[1],
        api_secret: match[2],
        cloud_name: match[3],
        mode: 'url'
      };
    }
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD || process.env.CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    return {
      api_key: apiKey,
      api_secret: apiSecret,
      cloud_name: cloudName,
      mode: 'split'
    };
  }

  return null;
};

const cloudinaryNotConfiguredPayload = {
  error: 'Cloudinary is not configured on the server',
  detail: 'Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in the production server environment.'
};

app.get('/api/health', (_req, res) => {
  const cloudinaryConfig = getCloudinaryConfig();
  res.json({
    ok: true,
    service: 'choose-me-media',
    cloudinaryConfigured: Boolean(cloudinaryConfig),
    cloudinaryConfigMode: cloudinaryConfig?.mode || 'missing'
  });
});

const configureCloudinary = () => {
  const cloudinaryConfig = getCloudinaryConfig();
  if (!cloudinaryConfig) return false;

  cloudinary.config({
    api_key: cloudinaryConfig.api_key,
    api_secret: cloudinaryConfig.api_secret,
    cloud_name: cloudinaryConfig.cloud_name,
    secure: true,
    timeout: 180000
  });

  return true;
};

const serializeError = (error) => {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    return error.message || JSON.stringify(error);
  }
  return String(error);
};

const uploadToCloudinary = (fileBuffer, options) => (
  new Promise((resolve, reject) => {
    const streamOptions = {
      ...options,
      timeout: 180000
    };
    const uploadMethod = options?.resource_type === 'video'
      ? cloudinary.uploader.upload_chunked_stream
      : cloudinary.uploader.upload_stream;

    const stream = uploadMethod.call(cloudinary.uploader, streamOptions, (error, result) => {
      if (error || !result) {
        reject(error || new Error('Cloudinary upload failed'));
        return;
      }

      resolve(result);
    });

    stream.end(fileBuffer);
  })
);

const isFirebaseStorageUrl = (value) => (
  typeof value === 'string' &&
  value.includes('firebasestorage.googleapis.com') &&
  !value.includes('res.cloudinary.com')
);

const normalizeCloudinaryFolderSegment = (value) => (
  String(value || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_')
);

app.post('/api/cloudinary/sign-upload', (req, res) => {
  const cloudinaryConfig = getCloudinaryConfig();
  if (!cloudinaryConfig) {
    return res.status(500).json(cloudinaryNotConfiguredPayload);
  }

  const resourceType = req.body?.resourceType === 'video'
    ? 'video'
    : req.body?.resourceType === 'image'
      ? 'image'
      : '';

  if (!resourceType) {
    return res.status(400).json({ error: 'Invalid Cloudinary resource type' });
  }

  const userId = normalizeCloudinaryFolderSegment(req.body?.userId || 'anonymous');
  const folder = resourceType === 'video'
    ? `choose-me/performances/${userId}`
    : `choose-me/profiles/${userId}`;
  const publicId = `${resourceType === 'video' ? 'performance' : 'profile'}_${Date.now()}`;
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = {
    folder,
    public_id: publicId,
    timestamp
  };

  return res.json({
    cloudName: cloudinaryConfig.cloud_name,
    apiKey: cloudinaryConfig.api_key,
    signature: cloudinary.utils.api_sign_request(paramsToSign, cloudinaryConfig.api_secret),
    timestamp,
    folder,
    publicId,
    resourceType
  });
});

const uploadRemoteVideoToCloudinary = async ({ url, folder, publicIdPrefix }) => {
  if (!isFirebaseStorageUrl(url)) {
    throw new Error('Only Firebase Storage legacy URLs can be migrated');
  }

  try {
    const result = await cloudinary.uploader.upload(url, {
      resource_type: 'video',
      folder,
      public_id: `${publicIdPrefix}_${Date.now()}`,
      unique_filename: true,
      overwrite: false
    });

    const thumbnailUrl = cloudinary.url(result.public_id, {
      resource_type: 'video',
      secure: true,
      format: 'jpg',
      transformation: [
        { start_offset: '0' },
        { width: 720, crop: 'scale' }
      ]
    });

    return { result, thumbnailUrl };
  } catch (remoteError) {
    console.warn('Cloudinary remote upload failed, falling back to server download:', remoteError);
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Unable to download legacy video: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const result = await uploadToCloudinary(buffer, {
    resource_type: 'video',
    folder,
    public_id: `${publicIdPrefix}_${Date.now()}`,
    unique_filename: true,
    overwrite: false
  });

  const thumbnailUrl = cloudinary.url(result.public_id, {
    resource_type: 'video',
    secure: true,
    format: 'jpg',
    transformation: [
      { start_offset: '0' },
      { width: 720, crop: 'scale' }
    ]
  });

  return { result, thumbnailUrl };
};

app.post('/api/performance-media', upload.single('file'), async (req, res) => {
  if (!configureCloudinary()) {
    return res.status(500).json(cloudinaryNotConfiguredPayload);
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Missing media file' });
  }

  const looksLikeVideoFile = /\.(webm|mp4|mov|m4v|ogg)$/i.test(req.file.originalname || '');
  const isVideoMime = req.file.mimetype.startsWith('video/');
  const isBrowserBlobMime = ['application/octet-stream', ''].includes(req.file.mimetype);

  if (!isVideoMime && !(isBrowserBlobMime && looksLikeVideoFile)) {
    return res.status(400).json({
      error: 'Only video uploads are supported',
      detail: `Received mimetype "${req.file.mimetype}" for "${req.file.originalname}"`
    });
  }

  const userId = String(req.body.userId || 'anonymous').replace(/[^a-zA-Z0-9_-]/g, '_');

  try {
    const result = await uploadToCloudinary(req.file.buffer, {
      resource_type: 'video',
      folder: `choose-me/performances/${userId}`,
      use_filename: true,
      unique_filename: true,
      overwrite: false
    });

    const thumbnailUrl = cloudinary.url(result.public_id, {
      resource_type: 'video',
      secure: true,
      format: 'jpg',
      transformation: [
        { start_offset: '0' },
        { width: 720, crop: 'scale' }
      ]
    });

    return res.json({
      provider: 'cloudinary',
      videoUrl: result.secure_url,
      secureUrl: result.secure_url,
      thumbnailUrl,
      publicId: result.public_id,
      resourceType: result.resource_type,
      format: result.format,
      bytes: result.bytes,
      duration: result.duration,
      width: result.width,
      height: result.height
    });
  } catch (error) {
    console.error('Cloudinary performance upload failed:', error);
    const cloudinaryStatus = error?.http_code || error?.status || 500;
    const status = cloudinaryStatus === 499 ? 504 : cloudinaryStatus;
    return res.status(status).json({
      error: 'Unable to upload video to Cloudinary',
      detail: serializeError(error)
    });
  }
});

app.post('/api/profile-image', upload.single('file'), async (req, res) => {
  if (!configureCloudinary()) {
    return res.status(500).json(cloudinaryNotConfiguredPayload);
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Missing image file' });
  }

  const looksLikeImageFile = /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(req.file.originalname || '');
  const isImageMime = req.file.mimetype.startsWith('image/');
  const isBrowserBlobMime = ['application/octet-stream', ''].includes(req.file.mimetype);

  if (!isImageMime && !(isBrowserBlobMime && looksLikeImageFile)) {
    return res.status(400).json({
      error: 'Only image uploads are supported',
      detail: `Received mimetype "${req.file.mimetype}" for "${req.file.originalname}"`
    });
  }

  const userId = normalizeCloudinaryFolderSegment(req.body.userId || 'anonymous');

  try {
    let imageBuffer = req.file.buffer;

    try {
      imageBuffer = await sharp(req.file.buffer)
        .rotate()
        .resize(960, 960, {
          fit: 'cover',
          position: 'attention'
        })
        .jpeg({
          quality: 86,
          mozjpeg: true
        })
        .toBuffer();
    } catch (resizeError) {
      console.warn('Profile image resize skipped:', resizeError);
    }

    const result = await uploadToCloudinary(imageBuffer, {
      resource_type: 'image',
      folder: `choose-me/profiles/${userId}`,
      public_id: `profile_${Date.now()}`,
      unique_filename: true,
      overwrite: false,
      format: 'jpg'
    });

    const optimizedUrl = cloudinary.url(result.public_id, {
      resource_type: 'image',
      secure: true,
      transformation: [
        { width: 720, height: 720, crop: 'fill', gravity: 'auto' },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });

    return res.json({
      provider: 'cloudinary',
      imageUrl: optimizedUrl,
      secureUrl: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height
    });
  } catch (error) {
    console.error('Cloudinary profile image upload failed:', error);
    const cloudinaryStatus = error?.http_code || error?.status || 500;
    const status = cloudinaryStatus === 499 ? 504 : cloudinaryStatus;
    return res.status(status).json({
      error: 'Unable to upload image to Cloudinary',
      detail: serializeError(error)
    });
  }
});

app.post('/api/reportage-media', upload.single('file'), async (req, res) => {
  if (!configureCloudinary()) {
    return res.status(500).json(cloudinaryNotConfiguredPayload);
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Missing media file' });
  }

  const fileName = req.file.originalname || '';
  const isVideoMime = req.file.mimetype.startsWith('video/');
  const isImageMime = req.file.mimetype.startsWith('image/');
  const looksLikeVideoFile = /\.(webm|mp4|mov|m4v|ogg)$/i.test(fileName);
  const looksLikeImageFile = /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(fileName);
  const isBrowserBlobMime = ['application/octet-stream', ''].includes(req.file.mimetype);
  const resourceType = isVideoMime || (isBrowserBlobMime && looksLikeVideoFile) ? 'video' : 'image';

  if (
    !isVideoMime &&
    !isImageMime &&
    !(isBrowserBlobMime && (looksLikeVideoFile || looksLikeImageFile))
  ) {
    return res.status(400).json({
      error: 'Only image and video uploads are supported',
      detail: `Received mimetype "${req.file.mimetype}" for "${fileName}"`
    });
  }

  const userId = normalizeCloudinaryFolderSegment(req.body.userId || 'anonymous');

  try {
    let uploadBuffer = req.file.buffer;
    const uploadOptions = {
      resource_type: resourceType,
      folder: `choose-me/reportages/${userId}`,
      public_id: `press_${resourceType}_${Date.now()}`,
      unique_filename: true,
      overwrite: false
    };

    if (resourceType === 'image') {
      try {
        uploadBuffer = await sharp(req.file.buffer)
          .rotate()
          .resize(1400, 1400, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({
            quality: 86,
            mozjpeg: true
          })
          .toBuffer();
        uploadOptions.format = 'jpg';
      } catch (resizeError) {
        console.warn('Reportage image resize skipped:', resizeError);
      }
    }

    const result = await uploadToCloudinary(uploadBuffer, uploadOptions);
    const thumbnailUrl = resourceType === 'video'
      ? cloudinary.url(result.public_id, {
          resource_type: 'video',
          secure: true,
          format: 'jpg',
          transformation: [
            { start_offset: '0' },
            { width: 720, crop: 'scale' }
          ]
        })
      : cloudinary.url(result.public_id, {
          resource_type: 'image',
          secure: true,
          transformation: [
            { width: 960, crop: 'scale' },
            { quality: 'auto', fetch_format: 'auto' }
          ]
        });

    return res.json({
      provider: 'cloudinary',
      mediaUrl: result.secure_url,
      videoUrl: resourceType === 'video' ? result.secure_url : '',
      imageUrl: resourceType === 'image' ? thumbnailUrl : '',
      secureUrl: result.secure_url,
      thumbnailUrl,
      publicId: result.public_id,
      resourceType,
      format: result.format,
      bytes: result.bytes,
      duration: result.duration,
      width: result.width,
      height: result.height
    });
  } catch (error) {
    console.error('Cloudinary reportage upload failed:', error);
    const cloudinaryStatus = error?.http_code || error?.status || 500;
    const status = cloudinaryStatus === 499 ? 504 : cloudinaryStatus;
    return res.status(status).json({
      error: 'Unable to upload reportage media to Cloudinary',
      detail: serializeError(error)
    });
  }
});

app.post('/api/cloudinary/delete-media', async (req, res) => {
  if (!configureCloudinary()) {
    return res.status(500).json(cloudinaryNotConfiguredPayload);
  }

  const publicId = String(req.body?.publicId || '');
  const resourceType = req.body?.resourceType === 'image' ? 'image' : 'video';

  if (!publicId) {
    return res.status(400).json({ error: 'Missing Cloudinary publicId' });
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true
    });

    return res.json({ ok: true, result });
  } catch (error) {
    console.error('Cloudinary media delete failed:', error);
    return res.status(error?.http_code || error?.status || 500).json({
      error: 'Unable to delete media from Cloudinary',
      detail: serializeError(error)
    });
  }
});

app.post('/api/cloudinary/remote-video', async (req, res) => {
  if (!configureCloudinary()) {
    return res.status(500).json(cloudinaryNotConfiguredPayload);
  }

  const legacyUrl = String(req.body?.legacyUrl || '');

  if (!isFirebaseStorageUrl(legacyUrl)) {
    return res.status(400).json({ error: 'Only Firebase Storage URLs can be migrated' });
  }

  const source = normalizeCloudinaryFolderSegment(req.body?.source || 'media');
  const ownerId = normalizeCloudinaryFolderSegment(req.body?.ownerId || 'unknown');
  const docId = normalizeCloudinaryFolderSegment(req.body?.docId || 'legacy');

  try {
    const { result, thumbnailUrl } = await uploadRemoteVideoToCloudinary({
      url: legacyUrl,
      folder: `choose-me/migrated/${source}/${ownerId}`,
      publicIdPrefix: `${source}_${docId}`
    });

    return res.json({
      provider: 'cloudinary',
      videoUrl: result.secure_url,
      secureUrl: result.secure_url,
      thumbnailUrl,
      publicId: result.public_id,
      resourceType: result.resource_type,
      format: result.format,
      bytes: result.bytes,
      duration: result.duration,
      width: result.width,
      height: result.height
    });
  } catch (error) {
    console.error('Cloudinary remote video migration failed:', error);
    const detail = error instanceof Error ? error.message : String(error);
    const status = detail.includes('402') ? 402 : 500;
    return res.status(500).json({
      error: 'Unable to migrate remote video to Cloudinary',
      detail,
      hint: status === 402
        ? 'Firebase Storage refuses the source download with 402 Payment Required. Enable/restore Firebase Storage billing/quota or provide the original media files.'
        : undefined
    });
  }
});

// Serve static files from dist directory
app.use(express.static(join(__dirname, 'dist')));

// Handle SPA routing - send index.html for non-asset requests
app.get('*', (req, res) => {
  // Ne pas intercepter les requêtes pour les assets
  if (req.path.includes('.')) {
    return res.status(404).send('Not found');
  }
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

if (process.env.VERCEL !== '1') {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

export default app;
