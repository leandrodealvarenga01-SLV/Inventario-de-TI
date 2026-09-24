const path = require('path');
require('dotenv').config();

module.exports = {
  PORT: Number(process.env.PORT) || 3001,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  // Caminho para a planilha que serve de fonte única dos dados.
  DATA_FILE:
    process.env.DATA_FILE ||
    path.resolve(__dirname, '../../data/inventario_equipamentos_ti.xlsx'),
  SHEET_NAME: 'Inventário',
};
