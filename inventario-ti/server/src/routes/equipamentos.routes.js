const { Router } = require('express');
const controller = require('../controllers/equipamentos.controller');

const router = Router();

router.get('/', controller.list);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
