interface CloudinaryImageUploadResult {
  provider: 'cloudinary';
  imageUrl: string;
  secureUrl: string;
  publicId: string;
  resourceType?: string;
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
}

export async function uploadProfileImage(file: File, userId: string): Promise<string> {
  try {
    const mimeType = file.type?.startsWith('image/') ? file.type : 'image/jpeg';
    const extension = mimeType.includes('png')
      ? 'png'
      : mimeType.includes('webp')
        ? 'webp'
        : mimeType.includes('gif')
          ? 'gif'
          : 'jpg';
    const uploadFile = file.type === mimeType ? file : new File([file], `profile.${extension}`, { type: mimeType });
    const formData = new FormData();
    formData.append('file', uploadFile, `profile.${extension}`);
    formData.append('userId', userId);

    const response = await fetch('/api/profile-image', {
      method: 'POST',
      body: formData
    });

    const payload = await response.json().catch(() => null) as CloudinaryImageUploadResult | { error?: string; detail?: string } | null;

    if (!response.ok || !payload || !('imageUrl' in payload)) {
      const detail = payload && 'detail' in payload && payload.detail ? ` (${payload.detail})` : '';
      throw new Error(`${payload && 'error' in payload ? payload.error : 'Impossible d’uploader l’image sur Cloudinary.'}${detail}`);
    }

    return payload.imageUrl;
  } catch (e) {
    console.error('Erreur lors de l\'upload de l\'image:', e);
    throw new Error('Impossible d\'uploader l\'image. Veuillez réessayer.');
  }
}
