const express = require('express');
const router = express.Router();
const storageController = require('../controllers/storageController');

router.get('/', storageController.getAllStorageUnits);
router.get('/:id', storageController.getStorageUnitById);
router.post('/', storageController.createStorageUnit);
router.put('/:id', storageController.updateStorageUnit);
router.delete('/:id', storageController.deleteStorageUnit);

module.exports = router;
