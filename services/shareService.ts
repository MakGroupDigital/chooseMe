import { PerformanceVideo } from './performanceService';

/**
 * Partager une vidéo de performance
 */
export async function sharePerformanceVideo(
  video: PerformanceVideo,
  userName: string,
  userId: string
): Promise<void> {
  // Créer l'URL de la vidéo
  const videoUrl = `${window.location.origin}/#/performance/${userId}/${video.createdAt?.seconds || Date.now()}`;
  
  // Créer le texte de partage
  const title = `${userName} - Performance ChooseMe`;
  const text = `${video.caption}\n\n#ChooseMe #Talent #Sport`;
  
  // Vérifier si l'API Web Share est disponible
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url: videoUrl
      });
      console.log('✅ Vidéo partagée avec succès');
    } catch (error) {
      // Utilisateur a annulé le partage
      if ((error as Error).name !== 'AbortError') {
        console.error('❌ Erreur lors du partage:', error);
        fallbackShare(videoUrl, title, text);
      }
    }
  } else {
    // Fallback pour les navigateurs qui ne supportent pas Web Share API
    fallbackShare(videoUrl, title, text);
  }
}

/**
 * Fallback: Copier le lien dans le presse-papiers
 */
function fallbackShare(url: string, title: string, text: string): void {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url)
      .then(() => {
        alert('Lien copié dans le presse-papiers ! 📋');
      })
      .catch(() => {
        showShareModal(url, title, text);
      });
  } else {
    showShareModal(url, title, text);
  }
}

/**
 * Afficher un modal de partage avec options
 */
function showShareModal(url: string, title: string, text: string): void {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);
  const encodedTitle = encodeURIComponent(title);
  
  const shareOptions = [
    {
      name: 'WhatsApp',
      url: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      color: '#25D366'
    },
    {
      name: 'Facebook',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: '#1877F2'
    },
    {
      name: 'Twitter',
      url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      color: '#1DA1F2'
    },
    {
      name: 'LinkedIn',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: '#0A66C2'
    },
    {
      name: 'Copier le lien',
      url: url,
      color: '#19DB8A',
      copy: true
    }
  ];
  
  // Créer le modal
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4';
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
  
  const content = document.createElement('div');
  content.className = 'bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 max-w-sm w-full';
  
  content.innerHTML = `
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-white font-bold text-lg">Partager la vidéo</h3>
      <button class="text-white/60 hover:text-white" onclick="this.closest('.fixed').remove()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
    <div class="space-y-3">
      ${shareOptions.map(option => `
        <button 
          class="w-full flex items-center gap-3 p-4 rounded-2xl border border-white/10 hover:border-white/20 transition-all"
          onclick="
            ${option.copy 
              ? `navigator.clipboard.writeText('${url}').then(() => { alert('Lien copié ! 📋'); this.closest('.fixed').remove(); })`
              : `window.open('${option.url}', '_blank'); this.closest('.fixed').remove();`
            }
          "
        >
          <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background-color: ${option.color}20">
            <div class="w-6 h-6 rounded-full" style="background-color: ${option.color}"></div>
          </div>
          <span class="text-white font-semibold">${option.name}</span>
        </button>
      `).join('')}
    </div>
  `;
  
  modal.appendChild(content);
  document.body.appendChild(modal);
}

/**
 * Partager le profil d'un utilisateur
 */
export async function shareProfile(
  userName: string,
  userId: string,
  userType: string,
  stats?: { matchesPlayed?: number; goals?: number; assists?: number }
): Promise<void> {
  const profileUrl = `${window.location.origin}/#/profile/${userId}`;
  
  let text = `Découvrez le profil de ${userName} sur ChooseMe !\n\n`;
  
  if (stats && stats.matchesPlayed) {
    text += `⚽ ${stats.matchesPlayed} matchs | ${stats.goals || 0} buts | ${stats.assists || 0} passes\n\n`;
  }
  
  text += `#ChooseMe #${userType} #Talent`;
  
  const title = `${userName} - ChooseMe`;
  
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url: profileUrl
      });
      console.log('✅ Profil partagé avec succès');
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('❌ Erreur lors du partage:', error);
        fallbackShare(profileUrl, title, text);
      }
    }
  } else {
    fallbackShare(profileUrl, title, text);
  }
}

/**
 * Partage une vidéo du feed avec lien dynamique
 */
export async function shareVideoPost(
  videoId: string,
  userName: string,
  caption: string,
  videoUrl: string,
  thumbnailUrl: string,
  hashtags: string[]
): Promise<void> {
  try {
    const shareUrl = `${window.location.origin}/video/${videoId}`;
    const hashtagsText = hashtags.length > 0 ? '\n\n' + hashtags.map(tag => `#${tag}`).join(' ') : '';
    const shareText = `🎬 Découvrez la performance de @${userName} sur Choose Me!\n\n${caption}${hashtagsText}\n\n👉 Regardez la vidéo:`;

    if (navigator.share) {
      await navigator.share({
        title: `Performance de ${userName} - Choose Me`,
        text: shareText,
        url: shareUrl,
      });
      console.log('✅ Vidéo partagée avec succès');
    } else {
      // Fallback: copier le lien
      const fullText = `${shareText}\n${shareUrl}`;
      await navigator.clipboard.writeText(fullText);
      
      // Afficher un toast de confirmation
      showToast('✅ Lien copié dans le presse-papiers !');
    }
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      console.error('❌ Erreur lors du partage:', error);
      
      // Fallback: copier dans le presse-papiers
      try {
        const shareUrl = `${window.location.origin}/video/${videoId}`;
        const hashtagsText = hashtags.length > 0 ? '\n\n' + hashtags.map(tag => `#${tag}`).join(' ') : '';
        const shareText = `🎬 Découvrez la performance de @${userName} sur Choose Me!\n\n${caption}${hashtagsText}\n\n👉 Regardez la vidéo:\n${shareUrl}`;
        
        await navigator.clipboard.writeText(shareText);
        showToast('✅ Lien copié dans le presse-papiers !');
      } catch (clipboardError) {
        console.error('❌ Erreur copie presse-papiers:', clipboardError);
        showToast('❌ Impossible de partager la vidéo');
      }
    }
  }
}

/**
 * Affiche un toast de notification
 */
function showToast(message: string): void {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 12px 24px;
    border-radius: 12px;
    z-index: 9999;
    font-size: 14px;
    font-weight: 600;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    animation: slideIn 0.3s ease-out;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 2500);
}
