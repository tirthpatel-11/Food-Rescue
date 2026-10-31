const { pool } = require('../config/db');

// GET /api/ngos
exports.getAllNGOs = async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT 
        n.NGO_id,
        n.Name,
        n.Phone,
        n.Email,
        n.Address,
        COUNT(DISTINCT su.Unit_id) AS totalStorageUnits,
        COUNT(DISTINCT dp.Partner_id) AS totalPartners,
        COUNT(DISTINCT fd.Donation_id) AS totalManagedDonations,
        COUNT(DISTINCT fr.Request_id) AS totalReceivedRequests
      FROM NGO n
      LEFT JOIN Storage_Unit su ON n.NGO_id = su.NGO_id
      LEFT JOIN Delivery_partner dp ON n.NGO_id = dp.NGO_id
      LEFT JOIN Food_donation fd ON n.NGO_id = fd.NGO_id
      LEFT JOIN Food_request fr ON n.NGO_id = fr.NGO_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (n.Name LIKE ? OR n.Phone LIKE ? OR n.Email LIKE ? OR n.Address LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    query += `
      GROUP BY n.NGO_id, n.Name, n.Phone, n.Email, n.Address
      ORDER BY n.NGO_id DESC
    `;

    const [ngos] = await pool.query(query, params);
    res.json({ success: true, data: ngos });
  } catch (error) {
    next(error);
  }
};

// GET /api/ngos/:id
exports.getNGOById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [ngos] = await pool.query(`SELECT * FROM NGO WHERE NGO_id = ?`, [id]);

    if (ngos.length === 0) {
      return res.status(404).json({ success: false, message: 'NGO not found' });
    }

    // Associated Storage Units
    const [storageUnits] = await pool.query(
      `SELECT Unit_id, Unit_name, Storage_type, Location, Total_capacity 
       FROM Storage_Unit 
       WHERE NGO_id = ? 
       ORDER BY Unit_name ASC`,
      [id]
    );

    // Associated Delivery Partners with their Vehicles
    const [deliveryPartners] = await pool.query(
      `SELECT 
         dp.Partner_id, dp.Name, dp.Phone, dp.Email, dp.License_no, dp.Type,
         v.Vehicle_id, v.Vehicle_no, v.Vehicle_type, v.Capacity, v.Is_Refrigerated
       FROM Delivery_partner dp
       LEFT JOIN Vehicle v ON dp.Partner_id = v.Partner_id
       WHERE dp.NGO_id = ?
       ORDER BY dp.Name ASC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...ngos[0],
        storageUnits,
        deliveryPartners
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/ngos
exports.createNGO = async (req, res, next) => {
  try {
    const { Name, Phone, Email, Address } = req.body;

    if (!Name || !Phone || !Address) {
      return res.status(400).json({
        success: false,
        message: 'Name, Phone, and Address are required.'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO NGO (Name, Phone, Email, Address) VALUES (?, ?, ?, ?)`,
      [Name.trim(), Phone.trim(), Email ? Email.trim() : null, Address.trim()]
    );

    res.status(201).json({
      success: true,
      message: 'NGO created successfully',
      data: { NGO_id: result.insertId }
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/ngos/:id
exports.updateNGO = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { Name, Phone, Email, Address } = req.body;

    if (!Name || !Phone || !Address) {
      return res.status(400).json({
        success: false,
        message: 'Name, Phone, and Address are required.'
      });
    }

    const [result] = await pool.query(
      `UPDATE NGO SET Name = ?, Phone = ?, Email = ?, Address = ? WHERE NGO_id = ?`,
      [Name.trim(), Phone.trim(), Email ? Email.trim() : null, Address.trim(), id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'NGO not found' });
    }

    res.json({ success: true, message: 'NGO updated successfully' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/ngos/:id
exports.deleteNGO = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(`DELETE FROM NGO WHERE NGO_id = ?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'NGO not found' });
    }

    res.json({ success: true, message: 'NGO deleted successfully' });
  } catch (error) {
    next(error);
  }
};
