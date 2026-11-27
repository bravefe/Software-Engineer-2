const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

function mdToHtml(md) {
  let html = md;

  // Escape basic HTML chars (except in existing html tags if any)
  // We'll process line by line or blocks
  const lines = html.split('\n');
  const output = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let inTable = false;
  let tableHeader = true;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Code blocks
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3);
        output.push(`<pre><code class="language-${codeBlockLang}">`);
      } else {
        inCodeBlock = false;
        output.push('</code></pre>');
      }
      continue;
    }

    if (inCodeBlock) {
      output.push(line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
      continue;
    }

    // Tables
    if (line.trim().startsWith('|')) {
      const row = line.trim();
      if (!inTable) {
        inTable = true;
        tableHeader = true;
        output.push('<table class="report-table">');
      }

      // Check if separator line
      if (row.match(/^\|(\s*:?-+:?\s*\|)+$/)) {
        tableHeader = false;
        continue;
      }

      const cells = row.split('|').slice(1, -1);
      const tag = tableHeader ? 'th' : 'td';
      const rowHtml = '<tr>' + cells.map(c => {
        let content = c.trim();
        // inline formatting
        content = formatInline(content);
        return `<${tag}>${content}</${tag}>`;
      }).join('') + '</tr>';

      output.push(rowHtml);
      continue;
    } else if (inTable) {
      inTable = false;
      output.push('</table>');
    }

    // Empty lines
    if (line.trim() === '') {
      output.push('');
      continue;
    }

    // Horizontal rules
    if (line.trim() === '---') {
      output.push('<hr class="divider" />');
      continue;
    }

    // Blockquotes
    if (line.trim().startsWith('>')) {
      output.push(`<blockquote>${formatInline(line.trim().replace(/^>\s*/, ''))}</blockquote>`);
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      output.push(`<h1 class="doc-h1">${formatInline(line.slice(2))}</h1>`);
      continue;
    }
    if (line.startsWith('## ')) {
      output.push(`<h2 class="doc-h2">${formatInline(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith('### ')) {
      output.push(`<h3 class="doc-h3">${formatInline(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith('#### ')) {
      output.push(`<h4 class="doc-h4">${formatInline(line.slice(5))}</h4>`);
      continue;
    }

    // Lists
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      output.push(`<li>${formatInline(line.trim().slice(2))}</li>`);
      continue;
    }
    if (line.trim().match(/^\d+\.\s+/)) {
      const text = line.trim().replace(/^\d+\.\s+/, '');
      output.push(`<li>${formatInline(text)}</li>`);
      continue;
    }

    // Math blocks
    if (line.trim().startsWith('$$') && line.trim().endsWith('$$') && line.trim().length > 4) {
      output.push(`<div class="math-block">${line.trim()}</div>`);
      continue;
    }

    // Regular paragraphs
    output.push(`<p>${formatInline(line)}</p>`);
  }

  if (inTable) {
    output.push('</table>');
  }

  return output.join('\n');
}

function formatInline(text) {
  let res = text;
  // bold
  res = res.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // italics
  res = res.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // code
  res = res.replace(/`([^`]+)`/g, '<code>$1</code>');
  // links
  res = res.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return res;
}

async function generatePdf() {
  const mdPath = path.join(__dirname, 'final-report.md');
  const pdfPath = path.join(__dirname, 'Lab_7_Final_Report.pdf');
  const mdContent = fs.readFileSync(mdPath, 'utf8');

  const bodyHtml = mdToHtml(mdContent);

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Macau678 - Lab 7 Final Report</title>
  <style>
    @page {
      size: A4;
      margin: 20mm 15mm 20mm 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.5;
      color: #1f2937;
      margin: 0;
      padding: 0;
    }
    .cover {
      page-break-after: always;
      padding-top: 40px;
    }
    h1.doc-h1 {
      font-size: 20pt;
      font-weight: 700;
      color: #111827;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 6px;
      margin-top: 24px;
      margin-bottom: 14px;
    }
    h2.doc-h2 {
      font-size: 14pt;
      font-weight: 600;
      color: #1e3a8a;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 4px;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    h3.doc-h3 {
      font-size: 12pt;
      font-weight: 600;
      color: #1e40af;
      margin-top: 16px;
      margin-bottom: 8px;
    }
    h4.doc-h4 {
      font-size: 11pt;
      font-weight: 600;
      color: #374151;
      margin-top: 12px;
      margin-bottom: 6px;
    }
    p {
      margin-top: 0;
      margin-bottom: 8px;
      text-align: justify;
    }
    ul, ol {
      margin-top: 0;
      margin-bottom: 10px;
      padding-left: 24px;
    }
    li {
      margin-bottom: 4px;
    }
    hr.divider {
      border: 0;
      border-top: 1px solid #e5e7eb;
      margin: 16px 0;
    }
    blockquote {
      border-left: 4px solid #3b82f6;
      background-color: #f8fafc;
      padding: 8px 14px;
      margin: 10px 0;
      color: #334155;
      font-style: italic;
    }
    pre {
      background-color: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 10px;
      font-size: 8.5pt;
      font-family: Consolas, "Liberation Mono", Menlo, Courier, monospace;
      white-space: pre-wrap;
      word-break: break-all;
      margin: 10px 0;
    }
    code {
      font-family: Consolas, "Liberation Mono", Menlo, Courier, monospace;
      font-size: 9pt;
      background-color: #f1f5f9;
      padding: 2px 4px;
      border-radius: 3px;
      color: #0f172a;
    }
    pre code {
      padding: 0;
      background-color: transparent;
      color: inherit;
    }
    table.report-table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 16px 0;
      font-size: 9pt;
      page-break-inside: avoid;
    }
    table.report-table th, table.report-table td {
      border: 1px solid #d1d5db;
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
    }
    table.report-table th {
      background-color: #f3f4f6;
      font-weight: 600;
      color: #111827;
    }
    table.report-table tr:nth-child(even) td {
      background-color: #f9fafb;
    }
    .math-block {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 8px;
      font-family: monospace;
      text-align: center;
      margin: 10px 0;
    }
    a {
      color: #2563eb;
      text-decoration: none;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      font-size: 8pt;
      font-weight: 600;
      border-radius: 4px;
    }
    .badge-ready { background-color: #dcfce7; color: #166534; }
    .badge-not-ready { background-color: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;

  const htmlPath = path.join(__dirname, 'final-report.html');
  fs.writeFileSync(htmlPath, fullHtml, 'utf8');
  console.log('HTML written to:', htmlPath);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('file:///' + htmlPath.replace(/\\\\/g, '/'), { waitUntil: 'load' });

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    margin: {
      top: '18mm',
      bottom: '18mm',
      left: '15mm',
      right: '15mm'
    },
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size: 8pt; color: #9ca3af; width: 100%; text-align: right; padding-right: 15mm;">Macau678 Purchase Approval — Lab 7 Report</div>',
    footerTemplate: '<div style="font-size: 8pt; color: #9ca3af; width: 100%; text-align: center;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
    printBackground: true
  });

  await browser.close();
  console.log('PDF successfully generated at:', pdfPath);
}

generatePdf().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
