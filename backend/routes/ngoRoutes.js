const express = require('express');
const router = express.Router();
const ngoController = require('../controllers/ngoController');

router.get('/', ngoController.getAllNGOs);
router.get('/:id', ngoController.getNGOById);
router.post('/', ngoController.createNGO);
router.put('/:id', ngoController.updateNGO);
router.delete('/:id', ngoController.deleteNGO);

module.exports = router;
