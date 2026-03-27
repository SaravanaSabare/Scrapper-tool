import type { ItemRecord } from '../types/scraper'

function escapeCsv(value: unknown): string {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function exportItemsCsv(items: ItemRecord[], filename = 'scraped-items.csv') {
  const headers = [
    'Title', 'Company', 'Source', 'Category', 'Priority', 'Tags',
    'AI Summary', 'Link', 'Posted Date', 'Description'
  ]

  const rows = items.map((item) => [
    escapeCsv(item.title),
    escapeCsv(item.company),
    escapeCsv(item.source),
    escapeCsv(item.ai?.category),
    escapeCsv(item.ai?.priority),
    escapeCsv(item.ai?.tags?.join(', ')),
    escapeCsv(item.ai?.summary),
    escapeCsv(item.link),
    escapeCsv(item.posted_date),
    escapeCsv(item.description),
  ])

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
