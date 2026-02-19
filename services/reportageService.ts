import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { getFirestoreDb } from './firebase';

export interface ReportageItem {
  id: string;
  title: string;
  detail: string;
  videoUrl: string;
  reporter: string;
  date: string;
}

// Récupère les reportages depuis la collection racine "reportage"
export async function fetchReportages(): Promise<ReportageItem[]> {
  const db = getFirestoreDb();
  try {
    const ref = collection(db, 'reportage');
    const q = query(ref, orderBy('date', 'desc'));
    const snap = await getDocs(q);

    if (snap.empty) return [];

    const items: ReportageItem[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as any;
      const videoUrl = (data.video as string | undefined)?.trim() || '';
      if (!videoUrl) return;

      const dateStr =
        data.date && data.date.toDate
          ? data.date.toDate().toLocaleDateString()
          : '';

      items.push({
        id: docSnap.id,
        title: data.titre || 'Reportage',
        detail: data.detail || '',
        videoUrl,
        reporter: data.reporteur || 'Journaliste',
        date: dateStr
      });
    });

    return items;
  } catch (e) {
    console.error('Erreur chargement reportages Firestore:', e);
    return [];
  }
}

