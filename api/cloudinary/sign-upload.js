import { v2 as cloudinary } from 'cloudinary';

const getCloudinaryConfig = () => {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;

  if (cloudinaryUrl) {
    const match = cloudinaryUrl.match(/^cloudinary:\/\/<?([^:>]+)>?:<?([^@>]+)>?@(.+)$/);
    if (match) {
      return {
        api_key: match[1],
        api_secret: match[2],
        cloud_name: match[3]
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
      cloud_name: cloudName
    };
  }

  return null;
};

const normalizeCloudinaryFolderSegment = (value) => (
  String(value || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_')
);

const parseBody = async (req) => {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.trim()) return JSON.parse(req.body);

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  return rawBody ? JSON.parse(rawBody) : {};
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cloudinaryConfig = getCloudinaryConfig();
  if (!cloudinaryConfig) {
    return res.status(500).json({
      error: 'Cloudinary is not configured on the server',
      detail: 'Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in the production server environment.'
    });
  }

  let body = {};
  try {
    body = await parseBody(req);
  } catch (_error) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const resourceType = body?.resourceType === 'video'
    ? 'video'
    : body?.resourceType === 'image'
      ? 'image'
      : '';

  if (!resourceType) {
    return res.status(400).json({ error: 'Invalid Cloudinary resource type' });
  }

  const userId = normalizeCloudinaryFolderSegment(body?.userId || 'anonymous');
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

  return res.status(200).json({
    cloudName: cloudinaryConfig.cloud_name,
    apiKey: cloudinaryConfig.api_key,
    signature: cloudinary.utils.api_sign_request(paramsToSign, cloudinaryConfig.api_secret),
    timestamp,
    folder,
    publicId,
    resourceType
  });
}
