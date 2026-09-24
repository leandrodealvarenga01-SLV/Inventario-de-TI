// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('[erro]', err.message);
  res.status(500).json({ error: 'Erro interno ao acessar a planilha.', detail: err.message });
}

module.exports = errorHandler;
