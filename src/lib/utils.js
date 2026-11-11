export const parseISO = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const toISO = (d) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const todayStr = () => toISO(new Date())

export const addDays = (iso, n) => {
  const d = parseISO(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

export const daysBetween = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000)

export const fmtDate = (iso) =>
  iso ? parseISO(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''

export const fmtShort = (iso) =>
  iso ? parseISO(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''

export const overlaps = (aS, aE, bS, bE) => aS <= bE && bS <= aE

export const uid = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`

export const initials = (name = '') =>
  name
    .replace(/^(Mr|Ms|Mrs|Dr)\.?\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('')

export const plural = (n, word, many) => `${n} ${n === 1 ? word : many || word + 's'}`

export const relDays = (iso, today) => {
  const n = daysBetween(today, iso)
  if (n === 0) return 'today'
  if (n === 1) return 'tomorrow'
  if (n === -1) return 'yesterday'
  return n > 0 ? `in ${n} days` : `${-n} days ago`
}

export const cx = (...parts) => parts.filter(Boolean).join(' ')

// Resize + compress an uploaded image so it fits comfortably in localStorage.
export function fileToDataURL(file, maxSize = 640, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('That file is not a valid image.'))
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
