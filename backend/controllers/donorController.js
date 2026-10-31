const { pool } = require('../config/db');

// GET /api/donors
exports.getAllDonors = async (req, res, next) => {
  try {
    const { search, donorType } = req.query;
    let query = `
      SELECT 
        d.Donor_id,
        d.Name,
        d.Phone,
        d.Email,
        d.FSSAI_License_No,
        d.Address,
        d.Donor_Type,
        COUNT(fd.Donation_id) AS totalDonations,
        COALESCE(SUM(fd.Quantity), 0) AS totalQuantityDonated
      FROM Donor d
      LEFT JOIN Food_donation fd ON d.Donor_id = fd.Donor_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (d.Name LIKE ? OR d.Phone LIKE ? OR d.Email LIKE ? OR d.Address LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (donorType) {
      query += ` AND d.Donor_Type = ?`;
      params.push(donorType);
    }

    query += `
      GROUP BY d.Donor_id, d.Name, d.Phone, d.Email, d.FSSAI_License_No, d.Address, d.Donor_Type
      ORDER BY d.Donor_id DESC
    `;

    const [donors] = await pool.query(query, params);
    res.json({ success: true, data: donors });
  } catch (error) {
    next(error);
  }
};

// GET /api/donors/:id
exports.getDonorById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [donors] = await pool.query(
      `SELECT * FROM Donor WHERE Donor_id = ?`,
      [id]
    );

    if (donors.length === 0) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    // Get donations by this donor
    const [donations] = await pool.query(
      `SELECT 
        fd.Donation_id,
        fd.Quantity,
        fd.Status,
        fd.Donation_DateTime,
        fd.Pickup_window,
        fd.Pickup_DateTime,
        fi.Item_name,
        fi.Category,
        fi.Unit,
        fi.Expiry_Period_Hours,
        DATE_ADD(fd.Donation_DateTime, INTERVAL fi.Expiry_Period_Hours HOUR) AS Expiry_DateTime,
        ngo.Name AS ngoName,
        su.Unit_name AS unitName
      FROM Food_donation fd
      JOIN Food_item fi ON fd.Item_id = fi.Item_id
      LEFT JOIN NGO ngo ON fd.NGO_id = ngo.NGO_id
      LEFT JOIN Storage_Unit su ON fd.Unit_id = su.Unit_id
      WHERE fd.Donor_id = ?
      ORDER BY fd.Donation_DateTime DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...donors[0],
        donations
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/donors
exports.createDonor = async (req, res, next) => {
  try {
    const { Name, Phone, Email, FSSAI_License_No, Address, Donor_Type } = req.body;

    if (!Name || !Phone || !Address || !Donor_Type) {
      return res.status(400).json({
        success: false,
        message: 'Name, Phone, Address, and Donor_Type are required fields.'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO Donor (Name, Phone, Email, FSSAI_License_No, Address, Donor_Type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        Name.trim(),
        Phone.trim(),
        Email ? Email.trim() : null,
        FSSAI_License_No ? FSSAI_License_No.trim() : null,
        Address.trim(),
        Donor_Type.trim()
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Donor created successfully',
      data: { Donor_id: result.insertId }
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/donors/:id
exports.updateDonor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { Name, Phone, Email, FSSAI_License_No, Address, Donor_Type } = req.body;

    if (!Name || !Phone || !Address || !Donor_Type) {
      return res.status(400).json({
        success: false,
        message: 'Name, Phone, Address, and Donor_Type are required fields.'
      });
    }

    const [result] = await pool.query(
      `UPDATE Donor 
       SET Name = ?, Phone = ?, Email = ?, FSSAI_License_No = ?, Address = ?, Donor_Type = ?
       WHERE Donor_id = ?`,
      [
        Name.trim(),
        Phone.trim(),
        Email ? Email.trim() : null,
        FSSAI_License_No ? FSSAI_License_No.trim() : null,
        Address.trim(),
        Donor_Type.trim(),
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    res.json({ success: true, message: 'Donor updated successfully' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/donors/:id
exports.deleteDonor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(`DELETE FROM Donor WHERE Donor_id = ?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    res.json({ success: true, message: 'Donor deleted successfully' });
  } catch (error) {
    next(error);
  }
};
