const express = require('express');
const router = express.Router();
const foodItemController = require('../controllers/foodItemController');

router.get('/', foodItemController.getAllFoodItems);
router.get('/categories', foodItemController.getCategories);
router.get('/:id', foodItemController.getFoodItemById);
router.post('/', foodItemController.createFoodItem);
router.put('/:id', foodItemController.updateFoodItem);
router.delete('/:id', foodItemController.deleteFoodItem);

module.exports = router;
