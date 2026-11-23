// Reading guest spreadsheets in the browser, and the template / report downloads.
// The server re-checks every row, so this file only needs to turn a file into plain rows.

import { readSheet } from 'read-excel-file/browser'
import writeExcelFile from 'write-excel-file/browser'
import Papa from 'papaparse'

export const MAX_FILE_BYTES = 5 * 1024 * 1024
export const MAX_ROWS = 1000

// The fields a guest row can fill, and header names we recognise for each
export const FIELDS = [
  { key: 'name', label: 'Guest name', required: true, aliases: ['guest name', 'name', 'full name', 'guest', 'guest full name', 'nama', 'නම', 'பெயர்'] },
  { key: 'displayName', label: 'Name on invitation', aliases: ['name on invitation', 'name on the invitation', 'display name', 'invitation name', 'sinhala name', 'name in sinhala', 'ආරාධිත නම', 'ආරාධනාවේ නම'] },
  { key: 'phone', label: 'Phone number', aliases: ['phone', 'phone number', 'mobile', 'mobile number', 'whatsapp', 'whatsapp number', 'contact number', 'tel', 'telephone', 'දුරකථන', 'தொலைபேசி'] },
  { key: 'email', label: 'Email address', aliases: ['email', 'email address', 'e-mail', 'mail'] },
  { key: 'group', label: 'Group / side', aliases: ['group', 'group / side', 'group/side', 'side', 'group / household', 'group/household', 'household', 'family', 'party', 'category', 'කණ්ඩායම', 'பிரிவு'] },
  { key: 'notes', label: 'Notes', aliases: ['notes', 'note', 'comments', 'comment', 'remarks'] },
  // Only for packages with a QR code: Online (a personal link) or Physical (a printed card)
  {
    key: 'cardType',
    label: 'Card type',
    aliases: ['card type', 'card', 'type', 'invitation type', 'online / physical', 'online/physical', 'online or physical', 'physical / online', 'කාඩ්පත් වර්ගය', 'அட்டை வகை'],
  },
]

export class ImportFileError extends Error {}

function cellToText(value) {
  if (value == null) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : String(value)
  return String(value).trim()
}

// → { headers: string[], rows: { row: number, cells: string[] }[] }
export async function readGuestFile(file) {
  const name = file.name.toLowerCase()
  const isCsv = name.endsWith('.csv')
  const isXlsx = name.endsWith('.xlsx')
  if (!isCsv && !isXlsx) {
    throw new ImportFileError(
      name.endsWith('.xls')
        ? 'Old .xls files aren’t supported. In Excel, choose File → Save As → Excel Workbook (.xlsx), then upload again.'
        : 'This file type isn’t supported. Please upload an Excel (.xlsx) or CSV (.csv) file.',
    )
  }
  if (file.size > MAX_FILE_BYTES) throw new ImportFileError('This file is larger than 5 MB. Please split it into smaller files.')
  if (file.size === 0) throw new ImportFileError('This file is empty.')

  let grid
  try {
    if (isCsv) {
      const text = (await file.text()).replace(/^\uFEFF/, '')
      grid = Papa.parse(text, { skipEmptyLines: false }).data
    } else {
      grid = await readSheet(file)
    }
  } catch {
    throw new ImportFileError('We couldn’t read this file. Check it opens in Excel, save it again as .xlsx or .csv, and retry.')
  }

  const lines = grid.map((cells, i) => ({ row: i + 1, cells: (cells || []).map(cellToText) }))
  const nonEmpty = lines.filter((l) => l.cells.some((c) => c !== ''))
  if (nonEmpty.length === 0) throw new ImportFileError('We couldn’t find any rows in this file.')

  const [headerLine, ...dataLines] = nonEmpty
  const width = Math.max(...nonEmpty.map((l) => l.cells.length))
  const headers = Array.from({ length: width }, (_, i) => headerLine.cells[i] || `Column ${String.fromCharCode(65 + (i % 26))}`)

  if (dataLines.length === 0) throw new ImportFileError('The file only has a header row. Add your guests below it and upload again.')
  if (dataLines.length > MAX_ROWS) throw new ImportFileError(`This file has ${dataLines.length} guests. Please import up to ${MAX_ROWS} at a time.`)

  return { headers, rows: dataLines.map((l) => ({ row: l.row, cells: headers.map((_, i) => l.cells[i] ?? '') })) }
}

// Guess which column holds which field from the header names
export function autoMap(headers) {
  const norm = (s) => s.toLowerCase().replace(/[*_]/g, ' ').replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim()
  const mapping = {}
  const used = new Set()
  for (const field of FIELDS) {
    const idx = headers.findIndex((h, i) => !used.has(i) && field.aliases.includes(norm(h)))
    if (idx >= 0) {
      mapping[field.key] = idx
      used.add(idx)
    } else {
      mapping[field.key] = -1
    }
  }
  return mapping
}

// Turn sheet rows + chosen mapping into the rows the server expects
export function buildRows(rows, mapping) {
  const pick = (cells, key) => (mapping[key] >= 0 ? cells[mapping[key]] || '' : '')
  return rows.map(({ row, cells }) => {
    return {
      row,
      name: pick(cells, 'name'),
      displayName: pick(cells, 'displayName'),
      phone: pick(cells, 'phone'),
      email: pick(cells, 'email'),
      group: pick(cells, 'group'),
      notes: pick(cells, 'notes'),
      cardType: pick(cells, 'cardType'),
    }
  })
}

// ---------- downloads ----------

// Templates, one for each kind of guest list:
//   online  – everyone gets a personal link (Free, Premium)
//   mixed   – a Card type column: Online or Physical for each guest (Premium Plus, Signature, and
//             Printed Cards with the free online card)
//   printed – everyone gets a printed card: no phone or Card type columns (Printed Cards)
const TEMPLATES = {
  online: {
    headers: ['Guest Name', 'Name on Invitation', 'Phone Number', 'Email Address', 'Group', 'Notes'],
    widths: [28, 28, 18, 28, 22, 30],
    rows: [
      ['Amal Perera', 'අමල් පෙරේරා මහතා', '0771234567', 'amal@example.com', "Groom's family", ''],
      ['Kamala Silva', 'කමලා සිල්වා මහත්මිය', '0712345678', '', "Bride's family", 'Aunt'],
      ['Ruwan Fernando', '', '+94763456789', 'ruwan@example.com', 'Office', ''],
    ],
  },
  mixed: {
    headers: ['Guest Name', 'Name on Invitation', 'Card Type', 'Phone Number', 'Email Address', 'Group', 'Notes'],
    widths: [28, 28, 14, 18, 28, 22, 30],
    rows: [
      ['Amal Perera', 'අමල් පෙරේරා මහතා', 'Online', '0771234567', 'amal@example.com', "Groom's family", ''],
      ['Kamala Silva', 'කමලා සිල්වා මහත්මිය', 'Physical', '', '', "Bride's family", 'Aunt — printed card'],
      ['Ruwan Fernando', '', 'Online', '+94763456789', 'ruwan@example.com', 'Office', ''],
    ],
  },
  printed: {
    headers: ['Guest Name', 'Name on Invitation', 'Email Address', 'Group', 'Notes'],
    widths: [28, 28, 28, 22, 30],
    rows: [
      ['Amal Perera', 'අමල් පෙරේරා මහතා', '', "Groom's family", ''],
      ['Kamala Silva', 'කමලා සිල්වා මහත්මිය', '', "Bride's family", 'Aunt'],
      ['Ruwan Fernando', '', 'ruwan@example.com', 'Office', ''],
    ],
  },
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Stop spreadsheet apps from running a cell as a formula (CSV/formula injection)
function safeCell(value) {
  const s = value == null ? '' : String(value)
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
}

function toCsv(rows) {
  const esc = (v) => {
    const s = safeCell(v)
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  // BOM so Excel opens Sinhala/Tamil text correctly
  return '\uFEFF' + rows.map((r) => r.map(esc).join(',')).join('\r\n')
}

export function downloadTemplateCsv(kind = 'online') {
  const t = TEMPLATES[kind] || TEMPLATES.online
  download(new Blob([toCsv([t.headers, ...t.rows])], { type: 'text/csv;charset=utf-8' }), 'eventinvito-guest-template.csv')
}

export async function downloadTemplateXlsx(kind = 'online') {
  const t = TEMPLATES[kind] || TEMPLATES.online
  const header = t.headers.map((value) => ({ value, fontWeight: 'bold' }))
  // Phone numbers as text so Excel keeps the leading 0
  const body = t.rows.map((r) => r.map((value) => ({ value, type: String })))
  const blob = await writeExcelFile([header, ...body], { columns: t.widths.map((width) => ({ width })) }).toBlob()
  download(blob, 'eventinvito-guest-template.xlsx')
}

// A CSV listing each row with its problem or what happened to it.
// Shows the values exactly as they were in the file (rawRows), so the couple can fix and re-upload.
export function downloadReport(analysedRows, rawRows, filename, { onlyLeftOut = false } = {}) {
  const describe = (r) => {
    const parts = [...Object.values(r.errors || {}), ...Object.values(r.warnings || {})]
    if (r.duplicate?.type === 'existing') parts.push(`Matches existing guest "${r.duplicate.guestName}" (same ${r.duplicate.on})`)
    if (r.duplicate?.type === 'file') parts.push(`Same ${r.duplicate.on} as row ${r.duplicate.row} in this file`)
    return parts.join(' | ')
  }
  const label = { add: 'Added', update: 'Updated existing guest', skip: 'Skipped', exclude: 'Left out (has errors)' }
  const rawByRow = new Map(rawRows.map((r) => [r.row, r]))
  const list = analysedRows.filter((r) => (onlyLeftOut ? r.action === 'skip' || r.action === 'exclude' : r.action !== 'add' || describe(r)))
  const rows = [
    ['Row', 'Guest Name', 'Name on Invitation', 'Phone Number', 'Email Address', 'Notes', 'Result', 'Details'],
    ...list.map((r) => {
      const raw = rawByRow.get(r.row) || r.values
      return [r.row, raw.name, raw.displayName || '', raw.phone, raw.email, raw.notes, label[r.action], describe(r)]
    }),
  ]
  download(new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' }), filename)
}
