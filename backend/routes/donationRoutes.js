const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');

router.get('/', donationController.getAllDonations);
router.get('/:id', donationController.getDonationById);
router.post('/', donationController.createDonation);
router.put('/:id', donationController.updateDonation);
router.patch('/:id/status', donationController.updateDonationStatus);
router.delete('/:id', donationController.deleteDonation);

module.exports = router;
