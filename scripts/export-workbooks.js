#!/usr/bin/env node
'use strict';

// Exporta apostilas (Apostilas/...) e suas lições (subcoleção Lessons)
// em arquivos locais (HTML consolidado, JSON e opcionalmente PDF via Puppeteer).
//
// Pré-requisitos:
// - Credenciais Firebase Admin disponíveis (uma das opções abaixo):
//   1) Defina a variável de ambiente `GOOGLE_APPLICATION_CREDENTIALS` apontando para o arquivo JSON do service account;
//   2) Ou coloque `serviceAccountKey.json` na raiz do projeto;
//   3) Ou defina `FIREBASE_SERVICE_ACCOUNT_JSON` com o conteúdo JSON das credenciais.
//
// Uso:
//   node scripts/export-workbooks.js --book "NomeDaApostila" --out ./exports --format html
//   node scripts/export-workbooks.js --all --out ./exports --pdf
//   Opções:
//     --book <id>        Exporta apenas a apostila especificada
//     --all              Exporta todas as apostilas
//     --out <dir>        Diretório base de saída (default: ./exports/workbooks)
//     --format <fmt>     Formato: html (default) ou pdf
//     --pdf              Atalho para --format pdf
//     --split            Além do HTML consolidado, salva cada lição em arquivo separado

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

function parseArgs() {
  const argv = process.argv.slice(2);
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.replace(/^--/, '');
      const next = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true;
      args[key] = next;
      if (next !== true) i++;
    } else {
      if (!args._) args._ = [];
      args._.push(token);
    }
  }
  return args;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function sanitizeFileName(name) {
  return String(name)
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function initFirebaseAdmin() {
  // Tenta inicializar com diferentes fontes de credenciais
  if (!admin.apps.length) {
    try {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        const json = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        admin.initializeApp({ credential: admin.credential.cert(json) });
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
        // Carrega do caminho definido em GOOGLE_APPLICATION_CREDENTIALS
        const creds = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
        admin.initializeApp({ credential: admin.credential.cert(creds) });
      } else {
        // Procura por serviceAccountKey.json na raiz
        const defaultPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
        if (fs.existsSync(defaultPath)) {
          const creds = require(defaultPath);
          admin.initializeApp({ credential: admin.credential.cert(creds) });
        } else {
          // Tenta Application Default Credentials
          admin.initializeApp({ credential: admin.credential.applicationDefault() });
        }
      }
    } catch (err) {
      console.error('Falha ao inicializar Firebase Admin:', err.message);
      process.exit(1);
    }
  }
  return admin.firestore();
}

async function fetchWorkbooks(db, bookId) {
  if (bookId) {
    const docRef = db.collection('Apostilas').doc(bookId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) throw new Error(`Apostila '${bookId}' não encontrada.`);
    const wbData = { id: docSnap.id, ...docSnap.data() };
    const lessonsSnap = await db.collection(`Apostilas/${docSnap.id}/Lessons`).get();
    const lessons = lessonsSnap.docs.map(d => ({ docID: d.id, workbook: docSnap.id, ...d.data() }));
    lessons.sort((a, b) => String(a.title).localeCompare(String(b.title), undefined, { numeric: true }));
    return [{ ...wbData, lessons }];
  }

  // Todas as apostilas
  const snap = await db.collection('Apostilas').get();
  const result = [];
  for (const doc of snap.docs) {
    const id = doc.id;
    if (id === 'workbookCollections') continue; // ignora coleção auxiliar
    const wbData = { id, ...doc.data() };
    const lessonsSnap = await db.collection(`Apostilas/${id}/Lessons`).get();
    const lessons = lessonsSnap.docs.map(d => ({ docID: d.id, workbook: id, ...d.data() }));
    lessons.sort((a, b) => String(a.title).localeCompare(String(b.title), undefined, { numeric: true }));
    result.push({ ...wbData, lessons });
  }
  return result;
}

function buildWorkbookHTML(wb) {
  const title = sanitizeFileName(wb.id || wb.title || 'Apostila');
  const cover = wb.coverURL ? `<img src="${wb.coverURL}" alt="Capa" />` : '';
  const guidelinesBlock = wb.guidelines ? `
    <div class="guidelines">
      <h2>Guia</h2>
      <div class="guidelines-content">${wb.guidelines}</div>
    </div>
  ` : '';

  const lessonsHtml = (wb.lessons || []).map((ls) => {
    const lessonTitle = sanitizeFileName(ls.title || ls.docID);
    const unit = ls.unit ? `<span class="chip">${ls.unit}</span>` : '';
    const lang = ls.language ? `<span class="chip">${ls.language}</span>` : '';
    const content = ls.content || '';
    return `
      <section class="lesson">
        <h2>${lessonTitle}</h2>
        <div class="lesson-meta">${unit}${lang}</div>
        <div class="lesson-content">${content}</div>
      </section>
    `;
  }).join('\n');

  const level = wb.level ? `<div class="level">Nível: ${wb.level}</div>` : '';

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      :root { color-scheme: light; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Liberation Sans', sans-serif; background: #ffffff; color: #111827; }
      .page { max-width: 930px; margin: 0 auto; padding: 32px; }
      .header { display: flex; align-items: center; gap: 20px; margin-bottom: 16px; }
      .header img { width: 180px; height: auto; border-radius: 8px; object-fit: cover; box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
      .title-block h1 { font-size: 32px; margin: 0; }
      .title-block .level { font-size: 14px; color: #6b7280; margin-top: 6px; }

      .guidelines { background: #f9fafb; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 8px; }
      .guidelines h2 { margin: 0 0 8px; font-size: 20px; }
      .guidelines-content { line-height: 1.6; }

      .chip { display: inline-block; background: #eef2ff; color: #4338ca; border: 1px solid #e0e7ff; border-radius: 999px; padding: 4px 10px; font-size: 12px; margin-right: 8px; }

      .lesson { margin: 28px 0; padding-top: 18px; border-top: 1px solid #e5e7eb; }
      .lesson h2 { font-size: 22px; margin: 0 0 10px; }
      .lesson-meta { margin-bottom: 12px; }
      .lesson-content { line-height: 1.7; font-size: 16px; }

      /* Estilos para code/pre, similares ao caderno */
      .lesson-content pre { background: #f5f5f5; padding: 15px; border-radius: 6px; margin: 1em 0; overflow: auto; white-space: pre-wrap; word-break: break-word; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; }
      .lesson-content code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; white-space: pre-wrap; display: block; }
      .lesson-content h1, .lesson-content h2, .lesson-content h3 { margin-top: 1.5em; margin-bottom: 0.5em; font-weight: bold; }
      .lesson-content h1 { font-size: 24px; }
      .lesson-content h2 { font-size: 20px; }
      .lesson-content h3 { font-size: 18px; }
      .lesson-content p { margin-bottom: 1em; text-align: justify; }
      .lesson-content ul, .lesson-content ol { margin-left: 20px; margin-bottom: 1em; }
      .lesson-content li { margin-bottom: 0.5em; }
      .lesson-content strong { font-weight: bold; }
      .lesson-content em { font-style: italic; }
      .lesson-content hr { border: 0; border-top: 1px solid #ddd; margin: 2em 0; }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="header">
        ${cover}
        <div class="title-block">
          <h1>${title}</h1>
          ${level}
        </div>
      </div>
      ${guidelinesBlock}
      ${lessonsHtml}
    </div>
  </body>
</html>`;
}

async function writeOutputs(baseDir, wb, html, split) {
  const dir = path.join(baseDir, sanitizeFileName(wb.id));
  ensureDir(dir);
  const htmlPath = path.join(dir, 'workbook.html');
  fs.writeFileSync(htmlPath, html, 'utf-8');

  const jsonPath = path.join(dir, 'workbook.json');
  const serializable = { id: wb.id, title: wb.title || wb.id, level: wb.level || '', coverURL: wb.coverURL || '', guidelines: wb.guidelines || '', lessons: wb.lessons || [] };
  fs.writeFileSync(jsonPath, JSON.stringify(serializable, null, 2), 'utf-8');

  if (split && Array.isArray(wb.lessons)) {
    const lessonsDir = path.join(dir, 'lessons');
    ensureDir(lessonsDir);
    wb.lessons.forEach((ls) => {
      const fileName = sanitizeFileName(ls.title || ls.docID || 'lesson');
      const lessonHtml = `<!doctype html><html><head><meta charset="utf-8"><title>${fileName}</title></head><body>${ls.content || ''}</body></html>`;
      fs.writeFileSync(path.join(lessonsDir, `${fileName}.html`), lessonHtml, 'utf-8');
    });
  }

  return { dir, htmlPath, jsonPath };
}

async function writePdfIfRequested(dir, wb, html, shouldWritePdf) {
  if (!shouldWritePdf) return null;
  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch (e) {
    console.warn('Puppeteer não encontrado. Para gerar PDF, instale: npm i puppeteer');
    return null;
  }

  const browser = await puppeteer.launch({ headless: 'new' });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfPath = path.join(dir, `${sanitizeFileName(wb.id)}.pdf`);
    await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
    return pdfPath;
  } finally {
    await browser.close();
  }
}

async function main() {
  const args = parseArgs();
  const bookId = args.book || args.workbook || null;
  const exportAll = !!args.all || !bookId;
  const outDir = path.resolve(args.out || './exports/workbooks');
  const format = String(args.format || 'html').toLowerCase();
  const wantPdf = !!args.pdf || format === 'pdf';
  const split = !!args.split;

  ensureDir(outDir);
  const db = initFirebaseAdmin();

  const workbooks = await fetchWorkbooks(db, exportAll ? null : bookId);
  if (!workbooks.length) {
    console.log('Nenhuma apostila encontrada.');
    return;
  }

  for (const wb of workbooks) {
    const html = buildWorkbookHTML(wb);
    const { dir, htmlPath, jsonPath } = await writeOutputs(outDir, wb, html, split);
    const pdfPath = await writePdfIfRequested(dir, wb, html, wantPdf);
    console.log(`Exportado: ${wb.id}`);
    console.log(`- HTML: ${htmlPath}`);
    console.log(`- JSON: ${jsonPath}`);
    if (pdfPath) console.log(`- PDF:  ${pdfPath}`);
  }

  console.log('Concluído.');
}

main().catch((err) => {
  console.error('Erro:', err && err.stack ? err.stack : err);
  process.exit(1);
});