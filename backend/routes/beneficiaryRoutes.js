const express = require('express');
const router = express.Router();
const beneficiaryController = require('../controllers/beneficiaryController');

router.get('/', beneficiaryController.getAllBeneficiaries);
router.get('/:id', beneficiaryController.getBeneficiaryById);
router.post('/', beneficiaryController.createBeneficiary);
router.put('/:id', beneficiaryController.updateBeneficiary);
router.patch('/:id/status', beneficiaryController.updateVerificationStatus);
router.delete('/:id', beneficiaryController.deleteBeneficiary);

module.exports = router;
