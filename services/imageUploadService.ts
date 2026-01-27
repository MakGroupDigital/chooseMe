import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirebaseApp } from './firebase';

export async function uploadProfileImage(file: File, userId: string): Promise<string> {
  try {
    const storage = getStorage(getFirebaseApp());
    const fileName = `profiles/${userId}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, fileName);

    // Upload file
    await uploadBytes(storageRef, file);

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (e) {
    console.error('Erreur lors de l\'upload de l\'image:', e);
    throw new Error('Impossible d\'uploader l\'image. Veuillez réessayer.');
  }
}
