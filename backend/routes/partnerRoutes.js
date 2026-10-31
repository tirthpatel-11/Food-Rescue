const express = require('express');
const router = express.Router();
const partnerController = require('../controllers/partnerController');

router.get('/', partnerController.getAllPartners);
router.get('/vehicles/all', partnerController.getAllVehicles);
router.get('/:id', partnerController.getPartnerById);
router.post('/', partnerController.createPartner);
router.put('/:id', partnerController.updatePartner);
router.delete('/:id', partnerController.deletePartner);

module.exports = router;
