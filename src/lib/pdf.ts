import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

export { pdfjs }

export async function openPdf(data: ArrayBuffer) {
  // pdf.js "consume" el buffer, por eso se pasa una copia.
  return pdfjs.getDocument({ data: new Uint8Array(data.slice(0)) }).promise
}
