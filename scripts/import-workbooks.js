#!/usr/bin/env node
'use strict';

// Importa apostilas e lições a partir de arquivos JSON gerados por exportação
// Estrutura esperada: <baseDir>/<workbookName>/workbook.json
// O script recria/atualiza o documento em 'Apostilas/<workbookName>' e
// sua subcoleção 'Lessons' com os dados contidos em 'workbook.json'.
//
// Aviso: por padrão, o script faz 'merge' (não apaga campos existentes).
// Se você quiser um reset total das lições, use '--truncate' para apagar
// a subcoleção 'Lessons' antes de importar.
//
// Uso:
//   node scripts/import-workbooks.js --dir ./exports --book "Deep Dive"
//   node scripts/import-workbooks.js --dir ./exports --all
//   node scripts/import-workbooks.js --dir ./exports --all --truncate
//   node scripts/import-workbooks.js --dir ./exports --book "Essentials" --dry
//
// Opções:
//   --dir <path>    Diretório base onde estão os workbooks (default: ./exports)
//   --book <id>     Importa apenas a apostila informada
//   --all           Importa todas as apostilas encontradas em <dir>
//   --truncate      Apaga a subcoleção 'Lessons' antes de importar
//   --dry           Mostra o que seria feito (não escreve no Firestore)

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

function initFirebaseAdmin() {
  if (!admin.apps.length) {
    try {
      // Usa variáveis do .env (PEM em FIREBASE_ADMIN_PRIVATE_KEY)
      if (process.env.FIREBASE_ADMIN_PRIVATE_KEY && process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
        const creds = {
          project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
          client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          private_key: String(process.env.FIREBASE_ADMIN_PRIVATE_KEY).replace(/\\n/g, '\n'),
        };
        admin.initializeApp({ credential: admin.credential.cert(creds) });
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
        const creds = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
        admin.initializeApp({ credential: admin.credential.cert(creds) });
      } else {
        const defaultPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
        if (fs.existsSync(defaultPath)) {
          const creds = require(defaultPath);
          admin.initializeApp({ credential: admin.credential.cert(creds) });
        } else {
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

function findWorkbookDirs(baseDir) {
  if (!fs.existsSync(baseDir)) {
    throw new Error(`Diretório '${baseDir}' não existe.`);
  }
  const entries = fs.readdirSync(baseDir, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => path.join(baseDir, e.name));
}

function loadWorkbookJson(workbookDir) {
  const jsonPath = path.join(workbookDir, 'workbook.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Arquivo não encontrado: ${jsonPath}`);
  }
  const raw = fs.readFileSync(jsonPath, 'utf-8');
  return JSON.parse(raw);
}

async function deleteLessonsCollection(db, workbookId) {
  const colRef = db.collection('Apostilas').doc(workbookId).collection('Lessons');
  const snap = await colRef.get();
  if (snap.empty) return;

  // Apaga em lotes de até 500
  const chunks = [];
  const docs = snap.docs;
  const size = 500;
  for (let i = 0; i < docs.length; i += size) {
    chunks.push(docs.slice(i, i + size));
  }
  for (const group of chunks) {
    const batch = db.batch();
    group.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
}

async function writeWorkbook(db, workbookId, json, { dry, truncate }) {
  const wbDocRef = db.collection('Apostilas').doc(workbookId);

  const wbPayload = {
    // Campos típicos da apostila
    title: json.title || workbookId,
    level: json.level || '',
    coverURL: json.coverURL || '',
    guidelines: json.guidelines || '',
  };

  if (dry) {
    console.log(`[dry] Set Apostilas/${workbookId} =>`, wbPayload);
  } else {
    await wbDocRef.set(wbPayload, { merge: true });
  }

  if (truncate) {
    if (dry) {
      console.log(`[dry] Truncate subcoleção Lessons de '${workbookId}'`);
    } else {
      await deleteLessonsCollection(db, workbookId);
    }
  }

  const lessons = Array.isArray(json.lessons) ? json.lessons : [];
  if (!lessons.length) {
    console.log(`Nenhuma lição para '${workbookId}'.`);
    return;
  }

  // Escreve lições em lotes
  const size = 450;
  for (let i = 0; i < lessons.length; i += size) {
    const group = lessons.slice(i, i + size);
    const batch = dry ? null : db.batch();
    for (const ls of group) {
      const lessonId = ls.docID || String(ls.title || `lesson-${i}`);
      const lsRef = wbDocRef.collection('Lessons').doc(lessonId);
      // Gravamos exatamente o objeto do JSON, para manter "do jeito que estão"
      const payload = { ...ls };

      if (dry) {
        console.log(`[dry] Set Apostilas/${workbookId}/Lessons/${lessonId} =>`, payload);
      } else {
        batch.set(lsRef, payload, { merge: true });
      }
    }
    if (!dry) {
      await batch.commit();
    }
  }
}

async function main() {
  const args = parseArgs();
  const baseDir = path.resolve(args.dir || './exports');
  const bookId = args.book || null;
  const importAll = !!args.all || !bookId;
  const dry = !!args.dry;
  const truncate = !!args.truncate;

  const db = initFirebaseAdmin();

  let targets = [];
  if (importAll) {
    targets = findWorkbookDirs(baseDir);
  } else {
    const dir = path.join(baseDir, bookId);
    if (!fs.existsSync(dir)) throw new Error(`Diretório da apostila não encontrado: ${dir}`);
    targets = [dir];
  }

  if (!targets.length) {
    console.log('Nenhuma apostila encontrada para importar.');
    return;
  }

  for (const dir of targets) {
    const json = loadWorkbookJson(dir);
    const workbookId = json.id || path.basename(dir);
    console.log(`Importando '${workbookId}' a partir de: ${path.join(dir, 'workbook.json')}`);
    await writeWorkbook(db, workbookId, json, { dry, truncate });
    console.log(`Concluído: ${workbookId}`);
  }

  console.log('Importação finalizada.');
}

main().catch((err) => {
  console.error('Erro:', err && err.stack ? err.stack : err);
  process.exit(1);
});