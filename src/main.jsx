import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import QRCodeStyling from 'qr-code-styling'
import {
  Download,
  Edit3,
  Plus,
  QrCode,
  RefreshCcw,
  Save,
  Search,
  Trash2,
  Upload,
  X,
  AlertTriangle,
  FolderOpen
} from 'lucide-react'
import './index.css'

const STORAGE_KEY = 'qr-code-studio-items-v1'
const DEFAULT_FORM = {
  id: null,
  name: 'Nouveau QR code',
  project: 'Général',
  content: 'https://example.com',
  qrColor: '#F15A24',
  backgroundColor: '#FFFFFF',
  style: 'rounded',
  size: 320,
  logoDataUrl: ''
}

const stylesMap = {
  square: {
    label: 'Carré classique',
    dotsOptions: { type: 'square' },
    cornersSquareOptions: { type: 'square' },
    cornersDotOptions: { type: 'square' }
  },
  rounded: {
    label: 'Arrondi',
    dotsOptions: { type: 'rounded' },
    cornersSquareOptions: { type: 'extra-rounded' },
    cornersDotOptions: { type: 'dot' }
  },
  dots: {
    label: 'Points ronds',
    dotsOptions: { type: 'dots' },
    cornersSquareOptions: { type: 'extra-rounded' },
    cornersDotOptions: { type: 'dot' }
  },
  extraRounded: {
    label: 'Extra arrondi',
    dotsOptions: { type: 'extra-rounded' },
    cornersSquareOptions: { type: 'extra-rounded' },
    cornersDotOptions: { type: 'dot' }
  }
}

function uid() {
  return crypto?.randomUUID?.() || `qr-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function formatDate(dateString) {
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(dateString))
  } catch {
    return '—'
  }
}

function getQrOptions(form, renderSize = form.size) {
  const style = stylesMap[form.style] || stylesMap.rounded
  return {
    width: Number(renderSize),
    height: Number(renderSize),
    type: 'svg',
    data: form.content?.trim() || 'https://example.com',
    image: form.logoDataUrl || undefined,
    margin: 14,
    qrOptions: {
      errorCorrectionLevel: 'H'
    },
    imageOptions: {
      crossOrigin: 'anonymous',
      margin: 8,
      imageSize: 0.28,
      hideBackgroundDots: true
    },
    dotsOptions: {
      ...style.dotsOptions,
      color: form.qrColor
    },
    cornersSquareOptions: {
      ...style.cornersSquareOptions,
      color: form.qrColor
    },
    cornersDotOptions: {
      ...style.cornersDotOptions,
      color: form.qrColor
    },
    backgroundOptions: {
      color: form.backgroundColor
    }
  }
}

function useLocalStorageItems() {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  return [items, setItems]
}

function QRPreview({ form, className = '', size = 320 }) {
  const ref = useRef(null)
  const qrRef = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    ref.current.innerHTML = ''
    qrRef.current = new QRCodeStyling(getQrOptions(form, size))
    qrRef.current.append(ref.current)
    return () => {
      if (ref.current) ref.current.innerHTML = ''
    }
  }, [form.content, form.qrColor, form.backgroundColor, form.style, form.logoDataUrl, size])

  return <div ref={ref} className={`qr-preview ${className}`} />
}

function MiniQR({ item }) {
  return <QRPreview form={item} size={150} className="h-[150px] w-[150px]" />
}

function App() {
  const [items, setItems] = useLocalStorageItems()
  const [form, setForm] = useState(DEFAULT_FORM)
  const [mode, setMode] = useState('dashboard')
  const [query, setQuery] = useState('')
  const [projectFilter, setProjectFilter] = useState('all')
  const previewRef = useRef(null)

  const projects = useMemo(() => {
    return Array.from(new Set(items.map((item) => item.project).filter(Boolean))).sort()
  }, [items])

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        const q = query.trim().toLowerCase()
        const matchesQuery = !q || [item.name, item.project, item.content].some((value) => String(value || '').toLowerCase().includes(q))
        const matchesProject = projectFilter === 'all' || item.project === projectFilter
        return matchesQuery && matchesProject
      })
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
  }, [items, query, projectFilter])

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const resetForm = () => {
    setForm({ ...DEFAULT_FORM, id: null })
    setMode('editor')
  }

  const handleLogo = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Merci de sélectionner un fichier image.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => updateForm('logoDataUrl', reader.result)
    reader.readAsDataURL(file)
  }

  const saveQr = () => {
    const now = new Date().toISOString()
    const clean = {
      ...form,
      name: form.name?.trim() || 'QR code sans nom',
      project: form.project?.trim() || 'Général',
      content: form.content?.trim() || 'https://example.com',
      size: Number(form.size) || 320,
      updatedAt: now
    }

    if (clean.id) {
      setItems((current) => current.map((item) => (item.id === clean.id ? { ...item, ...clean } : item)))
    } else {
      setItems((current) => [{ ...clean, id: uid(), createdAt: now }, ...current])
    }
    setMode('dashboard')
  }

  const editQr = (item) => {
    setForm({ ...DEFAULT_FORM, ...item })
    setMode('editor')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteQr = (id) => {
    if (!confirm('Supprimer ce QR code de la bibliothèque ?')) return
    setItems((current) => current.filter((item) => item.id !== id))
  }

  const makeFileName = (source = form) => {
    const name = source.name || 'qr-code'
    return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'qr-code'
  }

  const download = useCallback((format, source = form) => {
    const qr = new QRCodeStyling({ ...getQrOptions(source, source.size || 320), type: format === 'svg' ? 'svg' : 'canvas' })
    qr.download({ name: makeFileName(source), extension: format })
  }, [form])

  const exportLibrary = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'qr-code-studio-library.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const importLibrary = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        if (!Array.isArray(data)) throw new Error('Format invalide')
        setItems(data)
      } catch {
        alert('Fichier invalide. Import impossible.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="min-h-screen bg-cream text-ink">
      <header className="border-b border-black/5 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange text-white shadow-card">
              <QrCode size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">QR Code Studio</h1>
              <p className="text-sm text-muted">Générez, personnalisez, sauvegardez et retrouvez vos QR codes.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setMode('dashboard')} className={`rounded-full px-4 py-2 text-sm font-medium transition ${mode === 'dashboard' ? 'bg-ink text-white' : 'bg-white text-ink shadow-card hover:bg-black/5'}`}>
              Bibliothèque
            </button>
            <button onClick={resetForm} className="inline-flex items-center gap-2 rounded-full bg-orange px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:opacity-90">
              <Plus size={16} /> Nouveau QR code
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8">
        <div className="mb-6 rounded-3xl border border-orange/15 bg-white p-4 text-sm text-muted shadow-card md:flex md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 text-orange" size={18} />
            <p>
              Cette version fonctionne sans Supabase : les QR codes sont stockés dans ce navigateur. Pour plusieurs utilisateurs ou plusieurs appareils, il faudra connecter une base plus tard.
            </p>
          </div>
        </div>

        {mode === 'dashboard' ? (
          <section>
            <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_260px_auto_auto]">
              <label className="relative block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher par nom, projet ou contenu…" className="h-12 w-full rounded-2xl border border-black/10 bg-white pl-11 pr-4 outline-none shadow-card focus:border-orange" />
              </label>
              <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="h-12 rounded-2xl border border-black/10 bg-white px-4 outline-none shadow-card focus:border-orange">
                <option value="all">Tous les projets</option>
                {projects.map((project) => <option key={project} value={project}>{project}</option>)}
              </select>
              <button onClick={exportLibrary} className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold shadow-card hover:bg-black/5">Exporter JSON</button>
              <label className="cursor-pointer rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold shadow-card hover:bg-black/5">
                Importer JSON
                <input type="file" accept="application/json" onChange={importLibrary} className="hidden" />
              </label>
            </div>

            {filteredItems.length === 0 ? (
              <div className="rounded-[2rem] bg-white p-12 text-center shadow-soft">
                <FolderOpen className="mx-auto mb-4 text-orange" size={44} />
                <h2 className="text-xl font-semibold">Aucun QR code trouvé</h2>
                <p className="mx-auto mt-2 max-w-md text-muted">Crée ton premier QR code, sauvegarde-le, puis retrouve-le ici dans la bibliothèque.</p>
                <button onClick={resetForm} className="mt-6 rounded-full bg-orange px-5 py-3 font-semibold text-white shadow-card">Créer un QR code</button>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredItems.map((item) => (
                  <article key={item.id} className="rounded-[2rem] bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft">
                    <div className="flex gap-4">
                      <div className="flex h-[170px] w-[170px] shrink-0 items-center justify-center rounded-3xl border border-black/5 bg-white p-3">
                        <MiniQR item={item} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="mb-2 inline-flex rounded-full bg-orange/10 px-3 py-1 text-xs font-semibold text-orange">{item.project || 'Général'}</p>
                        <h3 className="truncate text-lg font-semibold">{item.name}</h3>
                        <p className="mt-1 line-clamp-2 break-all text-sm text-muted">{item.content}</p>
                        <p className="mt-3 text-xs text-muted">Créé le {formatDate(item.createdAt || item.updatedAt)}</p>
                      </div>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <button onClick={() => editQr(item)} className="inline-flex items-center justify-center gap-1 rounded-xl bg-black/5 px-3 py-2 text-xs font-semibold hover:bg-black/10"><Edit3 size={14} /> Modifier</button>
                      <button onClick={() => download('png', item)} className="inline-flex items-center justify-center gap-1 rounded-xl bg-black/5 px-3 py-2 text-xs font-semibold hover:bg-black/10"><Download size={14} /> PNG</button>
                      <button onClick={() => download('svg', item)} className="inline-flex items-center justify-center gap-1 rounded-xl bg-black/5 px-3 py-2 text-xs font-semibold hover:bg-black/10"><Download size={14} /> SVG</button>
                      <button onClick={() => deleteQr(item.id)} className="inline-flex items-center justify-center gap-1 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"><Trash2 size={14} /> Suppr.</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="grid gap-6 lg:grid-cols-[440px_1fr]">
            <div className="rounded-[2rem] bg-white p-6 shadow-soft">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Créer / modifier</h2>
                  <p className="text-sm text-muted">Tous les changements mettent l’aperçu à jour.</p>
                </div>
                <button onClick={() => setMode('dashboard')} className="rounded-full bg-black/5 p-2 hover:bg-black/10"><X size={18} /></button>
              </div>

              <div className="space-y-4">
                <Field label="Nom du QR code">
                  <input value={form.name} onChange={(e) => updateForm('name', e.target.value)} className="input" />
                </Field>
                <Field label="Projet / catégorie">
                  <input value={form.project} onChange={(e) => updateForm('project', e.target.value)} placeholder="Ex. Franprix, Maplyo, Events…" className="input" />
                </Field>
                <Field label="Contenu à encoder : URL ou texte">
                  <textarea value={form.content} onChange={(e) => updateForm('content', e.target.value)} rows={3} className="input resize-none" />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Couleur QR">
                    <ColorInput value={form.qrColor} onChange={(value) => updateForm('qrColor', value)} />
                  </Field>
                  <Field label="Couleur fond">
                    <ColorInput value={form.backgroundColor} onChange={(value) => updateForm('backgroundColor', value)} />
                  </Field>
                </div>

                <Field label="Style visuel">
                  <select value={form.style} onChange={(e) => updateForm('style', e.target.value)} className="input">
                    {Object.entries(stylesMap).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
                  </select>
                </Field>

                <Field label={`Taille : ${form.size}px`}>
                  <input type="range" min="220" max="640" step="20" value={form.size} onChange={(e) => updateForm('size', Number(e.target.value))} className="w-full accent-orange" />
                </Field>

                <Field label="Logo central">
                  <div className="flex items-center gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-black/5 px-4 py-3 text-sm font-semibold hover:bg-black/10">
                      <Upload size={16} /> Uploader
                      <input type="file" accept="image/*" onChange={handleLogo} className="hidden" />
                    </label>
                    {form.logoDataUrl && <button onClick={() => updateForm('logoDataUrl', '')} className="rounded-2xl px-3 py-3 text-sm font-semibold text-red-600 hover:bg-red-50">Retirer</button>}
                  </div>
                </Field>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button onClick={saveQr} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange px-5 py-3 font-semibold text-white shadow-card hover:opacity-90"><Save size={18} /> Sauvegarder</button>
                  <button onClick={() => setForm({ ...DEFAULT_FORM, id: form.id })} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-black/5 px-5 py-3 font-semibold hover:bg-black/10"><RefreshCcw size={18} /> Réinitialiser</button>
                  <button onClick={() => download('png')} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3 font-semibold text-white hover:opacity-90"><Download size={18} /> PNG</button>
                  <button onClick={() => download('svg')} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3 font-semibold text-white hover:opacity-90"><Download size={18} /> SVG</button>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-soft">
              <h2 className="text-xl font-semibold">Aperçu</h2>
              <p className="mb-6 text-sm text-muted">Testez toujours le QR code avant impression, surtout avec un logo ou des couleurs claires.</p>
              <div className="flex min-h-[520px] items-center justify-center rounded-[2rem] bg-cream p-8">
                <div ref={previewRef} className="rounded-[2rem] bg-white p-6 shadow-card">
                  <QRPreview form={form} size={Math.min(Number(form.size) || 320, 480)} className="h-[min(70vw,480px)] w-[min(70vw,480px)] max-w-[480px]" />
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-ink">{label}</span>
      {children}
    </label>
  )
}

function ColorInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white p-2">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-11 cursor-pointer rounded-xl border-0 bg-transparent p-0" />
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent text-sm outline-none" />
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)
