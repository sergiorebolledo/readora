import { useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'
import { db } from '../db'
import { track } from '../lib/analytics'
import { ACCEPTED, detectFormat, importFile } from '../lib/import'

export type Importer = ReturnType<typeof useImporter>

export function useImporter() {
  const [status, setStatus] = useState<string | null>(null)

  async function importFiles(list: FileList | File[]) {
    const all = Array.from(list)
    const supported = all.filter((f) => detectFormat(f.name))
    // Evitar duplicados: mismo nombre de archivo y mismo tamaño.
    const existing = new Set((await db.books.toArray()).map((b) => `${b.fileName}|${b.fileSize}`))
    const files = supported.filter((f) => !existing.has(`${f.name}|${f.size}`))
    const duplicated = supported.length - files.length
    const skipped = all.length - supported.length
    let ok = 0
    for (const [i, f] of files.entries()) {
      setStatus(i18n.t('import.importing', { current: i + 1, total: files.length, name: f.name }))
      try {
        await importFile(f)
        ok++
      } catch (err) {
        console.error(err)
      }
    }
    const parts = [i18n.t('import.added', { count: ok })]
    if (duplicated) parts.push(i18n.t('import.duplicated', { count: duplicated }))
    if (skipped) parts.push(i18n.t('import.unsupported', { count: skipped }))
    setStatus(parts.join(' · '))
    track('books_imported', { added: ok, duplicated, unsupported: skipped, formats: [...new Set(files.map((f) => detectFormat(f.name)!))] })
    setTimeout(() => setStatus(null), 4000)
  }

  return { status, importFiles }
}

export function ImportButton({ onFiles, big = false }: { onFiles: (f: FileList) => void; big?: boolean }) {
  const input = useRef<HTMLInputElement>(null)
  const { t } = useTranslation()
  return (
    <>
      <input
        ref={input}
        type="file"
        accept={ACCEPTED}
        multiple
        hidden
        data-testid="import-input"
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <button
        onClick={() => input.current?.click()}
        aria-label={big ? undefined : t('import.button')}
        className={
          big
            ? 'flex items-center gap-2 rounded-full bg-accent px-8 py-3 text-lg font-semibold shadow-lg shadow-accent/30 hover:bg-accent-2'
            : 'flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-3 py-2 text-sm font-semibold shadow-lg shadow-accent/30 hover:bg-accent-2 sm:px-4'
        }
      >
        <Plus className="h-4 w-4" />
        <span className={big ? '' : 'hidden sm:inline'}>{t('import.button')}</span>
      </button>
    </>
  )
}
