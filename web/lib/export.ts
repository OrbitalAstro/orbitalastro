type ExportOptions = {
  format?: 'png'
  filename?: string
}

async function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export async function exportChartAsPNG(element: HTMLElement, options: ExportOptions = {}) {
  const filename = options.filename || `orbitalastro-export-${Date.now()}.png`
  const html2canvas = (await import('html2canvas')).default
  const canvas = await html2canvas(element, { backgroundColor: null, scale: 2 })
  await downloadDataUrl(canvas.toDataURL('image/png'), filename)
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

export async function copyShareableLink(_chart: unknown) {
  await copyText(window.location.href)
}

