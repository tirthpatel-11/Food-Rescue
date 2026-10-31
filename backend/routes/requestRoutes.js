const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');

router.get('/', requestController.getAllRequests);
router.get('/:id', requestController.getRequestById);
router.post('/', requestController.createRequest);
router.put('/:id', requestController.updateRequest);
router.patch('/:id/status', requestController.updateRequestStatus);
router.delete('/:id', requestController.deleteRequest);

module.exports = router;
