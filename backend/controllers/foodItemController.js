const { pool } = require('../config/db');

// GET /api/food-items
exports.getAllFoodItems = async (req, res, next) => {
  try {
    const { search, category } = req.query;
    let query = `
      SELECT 
        fi.Item_id,
        fi.Item_name,
        fi.Category,
        fi.Unit,
        fi.Expiry_Period_Hours,
        COUNT(DISTINCT fd.Donation_id) AS totalDonations,
        COALESCE(SUM(fd.Quantity), 0) AS totalQuantityDonated
      FROM Food_item fi
      LEFT JOIN Food_donation fd ON fi.Item_id = fd.Item_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (fi.Item_name LIKE ? OR fi.Category LIKE ? OR fi.Unit LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (category) {
      query += ` AND fi.Category = ?`;
      params.push(category);
    }

    query += `
      GROUP BY fi.Item_id, fi.Item_name, fi.Category, fi.Unit, fi.Expiry_Period_Hours
      ORDER BY fi.Item_name ASC
    `;

    const [items] = await pool.query(query, params);
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

// GET /api/food-items/categories
exports.getCategories = async (req, res, next) => {
  try {
    const [categories] = await pool.query(
      `SELECT DISTINCT Category FROM Food_item ORDER BY Category ASC`
    );
    res.json({ success: true, data: categories.map(c => c.Category) });
  } catch (error) {
    next(error);
  }
};

// GET /api/food-items/:id
exports.getFoodItemById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [items] = await pool.query(`SELECT * FROM Food_item WHERE Item_id = ?`, [id]);

    if (items.length === 0) {
      return res.status(404).json({ success: false, message: 'Food item not found' });
    }

    res.json({ success: true, data: items[0] });
  } catch (error) {
    next(error);
  }
};

// POST /api/food-items
exports.createFoodItem = async (req, res, next) => {
  try {
    const { Item_name, Category, Unit, Expiry_Period_Hours } = req.body;

    if (!Item_name || !Category || !Unit || !Expiry_Period_Hours) {
      return res.status(400).json({
        success: false,
        message: 'Item_name, Category, Unit, and Expiry_Period_Hours are required.'
      });
    }

    if (parseInt(Expiry_Period_Hours, 10) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Expiry_Period_Hours must be greater than 0.'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO Food_item (Item_name, Category, Unit, Expiry_Period_Hours) VALUES (?, ?, ?, ?)`,
      [Item_name.trim(), Category.trim(), Unit.trim(), parseInt(Expiry_Period_Hours, 10)]
    );

    res.status(201).json({
      success: true,
      message: 'Food item added successfully',
      data: { Item_id: result.insertId }
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/food-items/:id
exports.updateFoodItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { Item_name, Category, Unit, Expiry_Period_Hours } = req.body;

    if (!Item_name || !Category || !Unit || !Expiry_Period_Hours) {
      return res.status(400).json({
        success: false,
        message: 'Item_name, Category, Unit, and Expiry_Period_Hours are required.'
      });
    }

    if (parseInt(Expiry_Period_Hours, 10) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Expiry_Period_Hours must be greater than 0.'
      });
    }

    const [result] = await pool.query(
      `UPDATE Food_item 
       SET Item_name = ?, Category = ?, Unit = ?, Expiry_Period_Hours = ?
       WHERE Item_id = ?`,
      [Item_name.trim(), Category.trim(), Unit.trim(), parseInt(Expiry_Period_Hours, 10), id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Food item not found' });
    }

    res.json({ success: true, message: 'Food item updated successfully' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/food-items/:id
exports.deleteFoodItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(`DELETE FROM Food_item WHERE Item_id = ?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Food item not found' });
    }

    res.json({ success: true, message: 'Food item deleted successfully' });
  } catch (error) {
    next(error);
  }
};
