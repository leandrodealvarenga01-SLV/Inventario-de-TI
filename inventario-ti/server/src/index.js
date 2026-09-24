const express = require('express');
const cors = require('cors');
const { PORT, CLIENT_ORIGIN, DATA_FILE } = require('./config');
const equipamentosRouter = require('./routes/equipamentos.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', dataFile: DATA_FILE });
});

app.use('/api/equipamentos', equipamentosRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API do inventário rodando em http://localhost:${PORT}`);
  console.log(`Lendo/gravando: ${DATA_FILE}`);
});
