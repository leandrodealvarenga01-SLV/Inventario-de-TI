const fs = require('fs');
const ExcelJS = require('exceljs');
const { DATA_FILE, SHEET_NAME } = require('../config');

const HEADER_ROW = 3;
const DATA_START_ROW = 4;
const EXAMPLE_MARKER = 'Exemplo de preenchimento';
const LEGEND_SHEET_NAME = 'Instruções';

const COLS = {
  id: 1,
  categoria: 2,
  equipamento: 3,
  modelo: 4,
  serie: 5,
  dataInclusao: 6,
  dataExclusao: 7,
  status: 8,
  localizacao: 9,
  responsavel: 10,
  observacoes: 11,
};

const FIELDS = Object.keys(COLS).filter((k) => k !== 'id');

// Fila simples para serializar escritas e evitar corrida entre requisições
// concorrentes sobre o mesmo arquivo.
let writeQueue = Promise.resolve();
function enqueue(task) {
  const run = writeQueue.then(task, task);
  writeQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function assertDataFileExists() {
  if (!fs.existsSync(DATA_FILE)) {
    throw new Error(
      `Planilha não encontrada em ${DATA_FILE}. Verifique a variável DATA_FILE ou a pasta data/.`
    );
  }
}

async function loadWorkbook() {
  assertDataFileExists();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(DATA_FILE);
  return workbook;
}

async function saveWorkbook(workbook) {
  const tmpPath = `${DATA_FILE}.tmp`;
  await workbook.xlsx.writeFile(tmpPath);
  fs.renameSync(tmpPath, DATA_FILE);
}

function getSheet(workbook) {
  return workbook.getWorksheet(SHEET_NAME) || workbook.worksheets[0];
}

function toISODate(value) {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const str = String(value).trim();
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? match[0] : '';
}

function parseISODateToUTC(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

function applyRowStyle(row) {
  const thin = { style: 'thin', color: { argb: 'FFBFBFBF' } };
  for (let col = 1; col <= 11; col += 1) {
    const cell = row.getCell(col);
    cell.font = { name: 'Arial', size: 10 };
    cell.border = { top: thin, left: thin, right: thin, bottom: thin };
    cell.alignment = { vertical: 'middle', wrapText: col === COLS.observacoes };
    if (col === COLS.dataInclusao || col === COLS.dataExclusao) {
      cell.numFmt = 'DD/MM/YYYY';
    }
  }
}

function writeRowValues(row, data) {
  row.getCell(COLS.id).value = data.id;
  row.getCell(COLS.categoria).value = data.categoria || '';
  row.getCell(COLS.equipamento).value = data.equipamento || '';
  row.getCell(COLS.modelo).value = data.modelo || '';
  row.getCell(COLS.serie).value = data.serie || '';
  row.getCell(COLS.dataInclusao).value = parseISODateToUTC(data.dataInclusao);
  row.getCell(COLS.dataExclusao).value = parseISODateToUTC(data.dataExclusao);
  row.getCell(COLS.status).value = data.status || '';
  row.getCell(COLS.localizacao).value = data.localizacao || '';
  row.getCell(COLS.responsavel).value = data.responsavel || '';
  row.getCell(COLS.observacoes).value = data.observacoes || '';
}

function rowToObject(row) {
  return {
    id: row.getCell(COLS.id).value,
    categoria: row.getCell(COLS.categoria).value || '',
    equipamento: row.getCell(COLS.equipamento).value || '',
    modelo: row.getCell(COLS.modelo).value || '',
    serie: row.getCell(COLS.serie).value || '',
    dataInclusao: toISODate(row.getCell(COLS.dataInclusao).value),
    dataExclusao: toISODate(row.getCell(COLS.dataExclusao).value),
    status: row.getCell(COLS.status).value || '',
    localizacao: row.getCell(COLS.localizacao).value || '',
    responsavel: row.getCell(COLS.responsavel).value || '',
    observacoes: row.getCell(COLS.observacoes).value || '',
  };
}

/**
 * Migra o layout "para preenchimento manual" (linha de exemplo + legenda
 * dentro da própria tabela) para um layout apto a ser controlado pela API:
 * remove a linha de exemplo e move a legenda para uma aba própria.
 * Idempotente — não faz nada se já tiver sido migrado antes.
 */
function migrateLegacyLayout(workbook) {
  const sheet = getSheet(workbook);
  let changed = false;

  const exampleNote = sheet.getRow(DATA_START_ROW).getCell(COLS.observacoes).value;
  if (typeof exampleNote === 'string' && exampleNote.includes(EXAMPLE_MARKER)) {
    sheet.spliceRows(DATA_START_ROW, 1);
    changed = true;
  }

  let legendStartRow = null;
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber >= DATA_START_ROW) {
      const first = row.getCell(1).value;
      if (typeof first === 'string' && first.includes('Legenda')) {
        legendStartRow = rowNumber;
      }
    }
  });

  if (legendStartRow) {
    const lines = [];
    for (let r = legendStartRow; r <= sheet.rowCount; r += 1) {
      const value = sheet.getRow(r).getCell(1).value;
      if (value) lines.push(String(value));
    }
    sheet.spliceRows(legendStartRow, sheet.rowCount - legendStartRow + 1);

    let legendSheet = workbook.getWorksheet(LEGEND_SHEET_NAME);
    if (!legendSheet) {
      legendSheet = workbook.addWorksheet(LEGEND_SHEET_NAME);
      legendSheet.getColumn(1).width = 100;
    }
    if (legendSheet.rowCount === 0) {
      lines.forEach((line, i) => {
        const cell = legendSheet.getCell(i + 1, 1);
        cell.value = line;
        cell.font = {
          name: 'Arial',
          size: i === 0 ? 11 : 9,
          bold: i === 0,
          italic: i !== 0,
          color: { argb: 'FF595959' },
        };
      });
    }
    changed = true;
  }

  return changed;
}

function findNextEmptyRow(sheet) {
  let nextRow = DATA_START_ROW;
  for (let r = DATA_START_ROW; r <= sheet.rowCount; r += 1) {
    const idValue = sheet.getRow(r).getCell(COLS.id).value;
    if (typeof idValue === 'number') nextRow = r + 1;
  }
  return nextRow;
}

function findRowNumberById(sheet, id) {
  const numericId = Number(id);
  for (let r = DATA_START_ROW; r <= sheet.rowCount; r += 1) {
    if (sheet.getRow(r).getCell(COLS.id).value === numericId) return r;
  }
  return null;
}

function findMaxId(sheet) {
  let max = 0;
  for (let r = DATA_START_ROW; r <= sheet.rowCount; r += 1) {
    const value = sheet.getRow(r).getCell(COLS.id).value;
    if (typeof value === 'number') max = Math.max(max, value);
  }
  return max;
}

async function listEquipamentos() {
  const workbook = await loadWorkbook();
  const sheet = getSheet(workbook);
  const items = [];
  for (let r = DATA_START_ROW; r <= sheet.rowCount; r += 1) {
    const row = sheet.getRow(r);
    if (typeof row.getCell(COLS.id).value === 'number') {
      items.push(rowToObject(row));
    }
  }
  return items.sort((a, b) => b.id - a.id);
}

async function createEquipamento(data) {
  return enqueue(async () => {
    const workbook = await loadWorkbook();
    migrateLegacyLayout(workbook);
    const sheet = getSheet(workbook);

    const nextRow = findNextEmptyRow(sheet);
    const id = findMaxId(sheet) + 1;
    const row = sheet.getRow(nextRow);
    writeRowValues(row, { ...data, id });
    applyRowStyle(row);
    row.commit();

    await saveWorkbook(workbook);
    return rowToObject(row);
  });
}

async function updateEquipamento(id, data) {
  return enqueue(async () => {
    const workbook = await loadWorkbook();
    migrateLegacyLayout(workbook);
    const sheet = getSheet(workbook);

    const rowNumber = findRowNumberById(sheet, id);
    if (!rowNumber) return null;

    const row = sheet.getRow(rowNumber);
    writeRowValues(row, { ...data, id: Number(id) });
    applyRowStyle(row);
    row.commit();

    await saveWorkbook(workbook);
    return rowToObject(row);
  });
}

async function deleteEquipamento(id) {
  return enqueue(async () => {
    const workbook = await loadWorkbook();
    migrateLegacyLayout(workbook);
    const sheet = getSheet(workbook);

    const rowNumber = findRowNumberById(sheet, id);
    if (!rowNumber) return false;

    sheet.spliceRows(rowNumber, 1);
    await saveWorkbook(workbook);
    return true;
  });
}

module.exports = {
  FIELDS,
  listEquipamentos,
  createEquipamento,
  updateEquipamento,
  deleteEquipamento,
};
