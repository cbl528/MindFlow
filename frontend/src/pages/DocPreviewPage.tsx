import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Download, FileText } from 'lucide-react'
import { knowledgeDocumentService } from '@/services/knowledgeService'
import { USE_BACKEND } from '@/config'
import { seed } from '@/data/seed'
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer'
import { Loading } from '@/components/shared/Loading'
import { Button } from '@/components/ui/button'
import type { KnowledgeDocumentVO } from '@/types'

type PreviewKind = 'pdf' | 'docx' | 'excel' | 'image' | 'markdown' | 'text' | 'other'

function detectKind(doc: KnowledgeDocumentVO): PreviewKind {
  const name = (doc.fileType || doc.docName || '').toLowerCase()
  if (/pdf/.test(name) || name.endsWith('.pdf')) return 'pdf'
  if (/docx|word/.test(name) || name.endsWith('.docx')) return 'docx'
  if (/excel|xlsx|xls/.test(name) || name.endsWith('.xlsx') || name.endsWith('.xls')) return 'excel'
  if (/png|jpe?g|gif|webp|svg|bmp/.test(name)) return 'image'
  if (/md|markdown/.test(name) || name.endsWith('.md')) return 'markdown'
  if (/txt|csv|html|json|xml/.test(name)) return 'text'
  return 'other'
}

export default function DocPreviewPage() {
  const { docId } = useParams<{ docId: string }>()
  const [doc, setDoc] = useState<KnowledgeDocumentVO | null>(null)
  const [kind, setKind] = useState<PreviewKind>('other')
  const [blobUrl, setBlobUrl] = useState('')
  const [error, setError] = useState('')
  const [markdownText, setMarkdownText] = useState('')
  const [pdfPages, setPdfPages] = useState<string[]>([])

  const docxRef = useRef<HTMLDivElement>(null)
  const excelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!docId) return
    let alive = true
    knowledgeDocumentService
      .get(docId)
      .then((d) => {
        if (!alive) return
        setDoc(d)
        setKind(detectKind(d))
      })
      .catch(() => alive && setError('文档不存在或已被删除'))
    return () => {
      alive = false
    }
  }, [docId])

  // 加载内容（按类型分发）
  useEffect(() => {
    if (!docId || !doc) return
    const id = docId
    const docSafe = doc
    let alive = true

    // 演示模式：直接渲染内置 markdown 预览，不加载真实文件
    if (!USE_BACKEND) {
      setKind('markdown')
      setMarkdownText(seed.demoPreview)
      return
    }

    async function run() {
      try {
        const k = detectKind(docSafe)
        setKind(k)

        if (k === 'image') {
          const blob = await knowledgeDocumentService.fileBlob(id)
          if (alive) setBlobUrl(URL.createObjectURL(blob))
          return
        }
        if (k === 'markdown' || k === 'text') {
          const text = await knowledgeDocumentService.preview(id)
          if (alive) setMarkdownText(text)
          return
        }
        if (k === 'pdf') {
          const blob = await knowledgeDocumentService.fileBlob(id)
          const arrayBuffer = await blob.arrayBuffer()
          if (alive) setBlobUrl(URL.createObjectURL(blob))
          if (alive) renderPdf(arrayBuffer)
          return
        }
        if (k === 'docx') {
          const blob = await knowledgeDocumentService.fileBlob(id)
          const arrayBuffer = await blob.arrayBuffer()
          if (alive) setBlobUrl(URL.createObjectURL(blob))
          if (alive) renderDocx(arrayBuffer)
          return
        }
        if (k === 'excel') {
          const blob = await knowledgeDocumentService.fileBlob(id)
          const arrayBuffer = await blob.arrayBuffer()
          if (alive) setBlobUrl(URL.createObjectURL(blob))
          if (alive) renderExcel(arrayBuffer)
          return
        }
        // other：只提供下载
        const blob = await knowledgeDocumentService.fileBlob(id)
        if (alive) setBlobUrl(URL.createObjectURL(blob))
      } catch {
        if (alive) setError('无法加载该文档')
      }
    }
    run()

    return () => {
      alive = false
      setPdfPages([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId, doc?.id])

  async function renderPdf(arrayBuffer: ArrayBuffer) {
    const pdfjs = await import('pdfjs-dist')
    const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
    const urls: string[] = []
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({ scale: 1.5 })
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      canvas.style.width = '100%'
      canvas.style.maxWidth = `${viewport.width}px`
      const ctx = canvas.getContext('2d')!
      await page.render({ canvasContext: ctx, viewport }).promise
      urls.push(canvas.toDataURL('image/png'))
    }
    setPdfPages(urls)
  }

  async function renderDocx(arrayBuffer: ArrayBuffer) {
    const { renderAsync } = await import('docx-preview')
    if (docxRef.current) {
      const el = docxRef.current
      el.innerHTML = ''
      await renderAsync(arrayBuffer, el, undefined, { ignoreLastRenderedPageBreak: true })
    }
  }

  async function renderExcel(arrayBuffer: ArrayBuffer) {
    const mod = await import('@js-preview/excel')
    if (excelRef.current) {
      const previewer = mod.default.init(excelRef.current)
      try {
        await previewer.preview(arrayBuffer)
      } catch {
        setError('Excel 预览失败，请下载查看')
      }
    }
  }

  return (
    <div className="flex h-screen flex-col bg-muted/30">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
        <Link to="/admin/knowledge" className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="truncate text-sm font-medium">{doc?.docName ?? '文档预览'}</span>
        <div className="ml-auto flex items-center gap-2">
          {blobUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={blobUrl} download={doc?.docName}>
                <Download className="h-3.5 w-3.5" />
                下载
              </a>
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        {error ? (
          <p className="py-16 text-center text-sm text-destructive">{error}</p>
        ) : !doc ? (
          <Loading />
        ) : (
          <div className="mx-auto w-full max-w-4xl p-4 md:p-6">
            {kind === 'image' && blobUrl && (
              <img src={blobUrl} alt={doc.docName} className="w-full rounded-xl" />
            )}
            {kind === 'markdown' && (
              <div className="rounded-xl border border-border bg-background p-6">
                <MarkdownRenderer content={markdownText} />
              </div>
            )}
            {kind === 'text' && (
              <pre className="overflow-x-auto rounded-xl border border-border bg-background p-6 font-mono text-sm leading-7">
                {markdownText}
              </pre>
            )}
            {kind === 'pdf' && (
              <div className="space-y-4">
                {pdfPages.length === 0 && <Loading label="正在渲染 PDF…" />}
                {pdfPages.map((src, i) => (
                  <div key={i} className="overflow-hidden rounded-xl border border-border bg-white">
                    <img src={src} alt={`第 ${i + 1} 页`} className="mx-auto" />
                  </div>
                ))}
              </div>
            )}
            {kind === 'docx' && (
              <div
                ref={docxRef}
                className="rounded-xl border border-border bg-white p-8 [&_section]:mb-6"
              />
            )}
            {kind === 'excel' && <div ref={excelRef} className="rounded-xl border border-border bg-white" />}
            {kind === 'other' && (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-background p-16">
                <FileText className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">该格式暂不支持在线预览</p>
                {blobUrl && (
                  <Button asChild>
                    <a href={blobUrl} download={doc?.docName}>
                      下载查看
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
