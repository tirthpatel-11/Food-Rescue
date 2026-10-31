const { pool } = require('../config/db');

// GET /api/storage-units
exports.getAllStorageUnits = async (req, res, next) => {
  try {
    const { ngoId, storageType, search } = req.query;

    let query = `
      SELECT 
        su.Unit_id,
        su.NGO_id,
        su.Unit_name,
        su.Storage_type,
        su.Location,
        su.Total_capacity,
        n.Name AS ngoName,
        n.Phone AS ngoPhone,
        -- Calculate current utilized capacity from active stored donations and deliveries to this unit
        COALESCE(
          (SELECT SUM(fd.Quantity) FROM Food_donation fd WHERE fd.Unit_id = su.Unit_id AND fd.Status IN ('Accepted', 'Collected')), 0
        ) +
        COALESCE(
          (SELECT SUM(del.Quantity) FROM Delivery del WHERE del.Unit_id = su.Unit_id AND del.Status = 'Delivered'), 0
        ) AS currentUtilizedQuantity,
        COUNT(DISTINCT del.Delivery_id) AS totalDeliveriesReceived
      FROM Storage_Unit su
      JOIN NGO n ON su.NGO_id = n.NGO_id
      LEFT JOIN Delivery del ON su.Unit_id = del.Unit_id
      WHERE 1=1
    `;
    const params = [];

    if (ngoId) {
      query += ` AND su.NGO_id = ?`;
      params.push(ngoId);
    }

    if (storageType) {
      query += ` AND su.Storage_type = ?`;
      params.push(storageType);
    }

    if (search) {
      query += ` AND (su.Unit_name LIKE ? OR su.Location LIKE ? OR n.Name LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += `
      GROUP BY su.Unit_id, su.NGO_id, su.Unit_name, su.Storage_type, su.Location, su.Total_capacity, n.Name, n.Phone
      ORDER BY su.Unit_id DESC
    `;

    const [units] = await pool.query(query, params);
    res.json({ success: true, data: units });
  } catch (error) {
    next(error);
  }
};

// GET /api/storage-units/:id
exports.getStorageUnitById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [units] = await pool.query(
      `SELECT 
        su.Unit_id,
        su.NGO_id,
        su.Unit_name,
        su.Storage_type,
        su.Location,
        su.Total_capacity,
        n.Name AS ngoName,
        n.Phone AS ngoPhone,
        n.Email AS ngoEmail,
        n.Address AS ngoAddress
      FROM Storage_Unit su
      JOIN NGO n ON su.NGO_id = n.NGO_id
      WHERE su.Unit_id = ?`,
      [id]
    );

    if (units.length === 0) {
      return res.status(404).json({ success: false, message: 'Storage unit not found' });
    }

    // Deliveries deposited into this storage unit
    const [deliveries] = await pool.query(
      `SELECT 
        del.Delivery_id,
        del.Quantity,
        del.Status,
        del.Pickup_DateTime,
        del.Delivery_DateTime,
        fi.Item_name,
        fi.Unit,
        dp.Name AS partnerName,
        dn.Name AS donorName
      FROM Delivery del
      JOIN Food_donation fd ON del.Donation_id = fd.Donation_id
      JOIN Food_item fi ON fd.Item_id = fi.Item_id
      JOIN Donor dn ON fd.Donor_id = dn.Donor_id
      JOIN Delivery_partner dp ON del.Delivery_partner_id = dp.Partner_id
      WHERE del.Unit_id = ?
      ORDER BY del.Delivery_id DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...units[0],
        deliveries
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/storage-units
exports.createStorageUnit = async (req, res, next) => {
  try {
    const { NGO_id, Unit_name, Storage_type, Location, Total_capacity } = req.body;

    if (!NGO_id || !Unit_name || !Storage_type || !Location || !Total_capacity) {
      return res.status(400).json({
        success: false,
        message: 'NGO_id, Unit_name, Storage_type, Location, and Total_capacity are required.'
      });
    }

    if (parseFloat(Total_capacity) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Total_capacity must be greater than 0.'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO Storage_Unit (NGO_id, Unit_name, Storage_type, Location, Total_capacity)
       VALUES (?, ?, ?, ?, ?)`,
      [
        parseInt(NGO_id, 10),
        Unit_name.trim(),
        Storage_type.trim(),
        Location.trim(),
        parseFloat(Total_capacity)
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Storage unit created successfully',
      data: { Unit_id: result.insertId }
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/storage-units/:id
exports.updateStorageUnit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { NGO_id, Unit_name, Storage_type, Location, Total_capacity } = req.body;

    if (!NGO_id || !Unit_name || !Storage_type || !Location || !Total_capacity) {
      return res.status(400).json({
        success: false,
        message: 'NGO_id, Unit_name, Storage_type, Location, and Total_capacity are required.'
      });
    }

    if (parseFloat(Total_capacity) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Total_capacity must be greater than 0.'
      });
    }

    const [result] = await pool.query(
      `UPDATE Storage_Unit 
       SET NGO_id = ?, Unit_name = ?, Storage_type = ?, Location = ?, Total_capacity = ?
       WHERE Unit_id = ?`,
      [
        parseInt(NGO_id, 10),
        Unit_name.trim(),
        Storage_type.trim(),
        Location.trim(),
        parseFloat(Total_capacity),
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Storage unit not found' });
    }

    res.json({ success: true, message: 'Storage unit updated successfully' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/storage-units/:id
exports.deleteStorageUnit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(`DELETE FROM Storage_Unit WHERE Unit_id = ?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Storage unit not found' });
    }

    res.json({ success: true, message: 'Storage unit deleted successfully' });
  } catch (error) {
    next(error);
  }
};
