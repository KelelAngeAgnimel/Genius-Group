import { PDFDocument } from 'pdf-lib'
import supabase from '../supabase.js'

// Limites des dépôts de copies (cf. docs/pole-educatif.md : 10 fichiers, 15 Mo par fichier ; + 20 Mo au total)
export const LIMITES = {
  nbFichiers: 10,
  octetsParFichier: 15 * 1024 * 1024,
  octetsTotal: 20 * 1024 * 1024
}
export const DUREE_URL_SECONDES = 5 * 60

const A4 = { largeur: 595.28, hauteur: 841.89 }
const MAX_PIXELS_PNG = 60_000_000

export class FichierInvalide extends Error {}

// Vrai type du fichier d'après ses premiers octets (le mimetype et l'extension envoyés par le client ne comptent pas)
export function detecterType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null
  if (buffer.subarray(0, 5).toString('latin1') === '%PDF-') return 'pdf'
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpeg'
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png'
  return null
}

// Nom d'affichage sûr (jamais utilisé comme chemin de stockage)
export const nomAffichable = (nom) =>
  String(nom ?? 'fichier').replace(/[\u0000-\u001f\u007f/\\]/g, '').trim().slice(0, 100) || 'fichier'

// Fusionne PDF et images (JPEG / PNG) dans l'ordre reçu en un seul PDF. Une image = une page A4.
export async function fusionnerEnPdf(fichiers) {
  const sortie = await PDFDocument.create()
  for (const { buffer, type } of fichiers) {
    try {
      if (type === 'pdf') {
        const source = await PDFDocument.load(buffer) // refuse les PDF chiffrés ou corrompus
        const pages = await sortie.copyPages(source, source.getPageIndices())
        pages.forEach(p => sortie.addPage(p))
      } else {
        if (type === 'png') {
          const largeur = buffer.readUInt32BE(16)
          const hauteur = buffer.readUInt32BE(20)
          if (!largeur || !hauteur || largeur * hauteur > MAX_PIXELS_PNG) throw new FichierInvalide('Image trop grande')
        }
        const image = type === 'png' ? await sortie.embedPng(buffer) : await sortie.embedJpg(buffer)
        const echelle = Math.min(A4.largeur / image.width, A4.hauteur / image.height, 1)
        const w = image.width * echelle
        const h = image.height * echelle
        const page = sortie.addPage([A4.largeur, A4.hauteur])
        page.drawImage(image, { x: (A4.largeur - w) / 2, y: (A4.hauteur - h) / 2, width: w, height: h })
      }
    } catch (err) {
      if (err instanceof FichierInvalide) throw err
      throw new FichierInvalide('Un des fichiers est illisible ou protégé')
    }
  }
  if (sortie.getPageCount() === 0) throw new FichierInvalide('Aucune page à enregistrer')
  return Buffer.from(await sortie.save())
}

// URL signée de courte durée (5 min) pour un fichier d'un bucket privé
export async function urlSignee(bucket, chemin) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(chemin, DUREE_URL_SECONDES)
  if (error || !data?.signedUrl) throw error ?? new Error('URL signée indisponible')
  return { url: data.signedUrl, expire_dans: DUREE_URL_SECONDES }
}

export async function supprimerFichiers(bucket, chemins) {
  const liste = (chemins ?? []).filter(Boolean)
  if (liste.length === 0) return
  const { error } = await supabase.storage.from(bucket).remove(liste)
  if (error) console.error(`[stockage] suppression ${bucket} impossible`, error)
}

export async function deposerPdf(bucket, chemin, buffer) {
  const { error } = await supabase.storage.from(bucket).upload(chemin, buffer, { contentType: 'application/pdf', upsert: false })
  if (error) throw error
}
