import api from '../api'

export const LIMITES = { nbFichiers: 10, octetsParFichier: 15 * 1024 * 1024, octetsTotal: 20 * 1024 * 1024 }
export const TYPES_ACCEPTES = ['application/pdf', 'image/jpeg', 'image/png']

export const formaterTaille = (octets) =>
  octets >= 1024 * 1024 ? `${(octets / 1024 / 1024).toFixed(1)} Mo` : `${Math.max(1, Math.round(octets / 1024))} Ko`

// Réduit une photo (max 2200 px, JPEG 85 %) : une photo de téléphone pèse souvent 5 Mo et plus,
// ce qui ferait vite dépasser les 20 Mo pour 10 pages. Applique aussi l'orientation EXIF.
// En cas d'échec, on garde le fichier d'origine.
export async function compresserImage(fichier) {
  if (!fichier.type.startsWith('image/')) return fichier
  try {
    const image = await createImageBitmap(fichier)
    const echelle = Math.min(1, 2200 / Math.max(image.width, image.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(image.width * echelle)
    canvas.height = Math.round(image.height * echelle)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff' // fond blanc pour les PNG transparents
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    image.close?.()
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85))
    if (!blob || blob.size >= fichier.size) return fichier
    return new File([blob], fichier.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })
  } catch {
    return fichier
  }
}

// Ouvre un fichier protégé : on réserve l'onglet tout de suite (sinon les mobiles bloquent la
// fenêtre après l'appel réseau), puis on le dirige vers l'URL signée de 5 minutes.
// `chemin` : route de l'API renvoyant { url }. Retourne un message d'erreur, ou null.
export async function ouvrirFichierProtege(chemin) {
  const fenetre = window.open('', '_blank')
  try {
    const res = await api.get(chemin)
    if (!res.ok || !res.data?.url) {
      fenetre?.close()
      return res.data?.message || 'Fichier indisponible'
    }
    if (fenetre) { fenetre.opener = null; fenetre.location.href = res.data.url }
    else window.location.href = res.data.url
    return null
  } catch {
    fenetre?.close()
    return 'Erreur réseau'
  }
}
