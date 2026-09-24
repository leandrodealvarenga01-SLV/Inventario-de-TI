const service = require('../services/spreadsheet.service');

const REQUIRED_FIELDS = ['equipamento', 'modelo', 'dataInclusao'];

function validate(data) {
  const missing = REQUIRED_FIELDS.filter((field) => !String(data[field] || '').trim());
  return missing;
}

function sanitize(body) {
  const out = {};
  service.FIELDS.forEach((field) => {
    out[field] = typeof body[field] === 'string' ? body[field].trim() : body[field] || '';
  });
  return out;
}

async function list(req, res, next) {
  try {
    const items = await service.listEquipamentos();
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const data = sanitize(req.body);
    const missing = validate(data);
    if (missing.length) {
      return res.status(400).json({ error: `Campos obrigatórios ausentes: ${missing.join(', ')}` });
    }
    const created = await service.createEquipamento(data);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const data = sanitize(req.body);
    const missing = validate(data);
    if (missing.length) {
      return res.status(400).json({ error: `Campos obrigatórios ausentes: ${missing.join(', ')}` });
    }
    const updated = await service.updateEquipamento(req.params.id, data);
    if (!updated) return res.status(404).json({ error: 'Equipamento não encontrado.' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const ok = await service.deleteEquipamento(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Equipamento não encontrado.' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, remove };
