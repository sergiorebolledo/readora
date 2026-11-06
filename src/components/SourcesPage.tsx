import { ExternalLink, FolderOpen, Globe, Server } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { SOURCES, useEnabledSources } from '../sources'
import type { Importer } from './Importer'

/** Página "Fuentes": activar/desactivar catálogos externos e importar una carpeta local. */
export function SourcesPage({ importer }: { importer: Importer }) {
  const { isOn, toggle } = useEnabledSources()
  const { t } = useTranslation()
  const folder = useRef<HTMLInputElement>(null)

  // "webkitdirectory" permite elegir una carpeta completa (incluye subcarpetas).
  useEffect(() => {
    folder.current?.setAttribute('webkitdirectory', '')
  }, [])

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-8">
      <h1 className="text-2xl font-bold">{t('sources.title')}</h1>
      <p className="mt-1 text-sm text-muted">{t('sources.subtitle')}</p>

      <h2 className="mb-3 mt-8 text-xs font-semibold uppercase tracking-widest text-accent-2">{t('sources.online')}</h2>
      <ul className="space-y-3">
        {SOURCES.map((s) => (
          <li key={s.id} className="flex items-start gap-4 rounded-2xl border border-line bg-surface p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent-2">
              <Globe className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{s.name}</p>
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted">{t(`sources.${s.id}.note`)}</span>
              </div>
              <p className="mt-1 text-sm text-muted">{t(`sources.${s.id}.description`)}</p>
              <p className="mt-1 text-xs text-muted/80">{t('sources.catalogsInfo', { count: s.catalogs.length })}</p>
              <a href={s.homepage} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-muted hover:text-white">
                {new URL(s.homepage).hostname} <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <Switch on={isOn(s.id)} onChange={() => toggle(s.id)} label={t('sources.toggle', { name: s.name })} />
          </li>
        ))}
        <li className="flex items-start gap-4 rounded-2xl border border-dashed border-line p-4 opacity-60">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-2">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">{t('sources.comingTitle')}</p>
            <p className="mt-1 text-sm text-muted">{t('sources.comingText')}</p>
          </div>
        </li>
      </ul>

      <h2 className="mb-3 mt-8 text-xs font-semibold uppercase tracking-widest text-accent-2">{t('sources.onDevice')}</h2>
      <div className="flex items-start gap-4 rounded-2xl border border-line bg-surface p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent-2">
          <FolderOpen className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{t('sources.folderTitle')}</p>
          <p className="mt-1 text-sm text-muted">{t('sources.folderText')}</p>
          <input
            ref={folder}
            type="file"
            multiple
            hidden
            data-testid="folder-input"
            onChange={(e) => {
              if (e.target.files?.length) importer.importFiles(e.target.files)
              e.target.value = ''
            }}
          />
          <button onClick={() => folder.current?.click()} className="mt-3 rounded-full bg-accent px-5 py-2 text-sm font-semibold shadow-lg shadow-accent/30 hover:bg-accent-2">
            {t('sources.folderButton')}
          </button>
        </div>
      </div>
    </div>
  )
}

function Switch({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-accent' : 'bg-surface-2'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  )
}
