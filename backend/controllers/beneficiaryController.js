const { pool } = require('../config/db');

// GET /api/beneficiaries
exports.getAllBeneficiaries = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    let query = `
      SELECT 
        b.Beneficiary_id,
        b.Name,
        b.Phone,
        b.Email,
        b.Address,
        b.Head_count,
        b.Verified_status,
        COUNT(fr.Request_id) AS totalRequests,
        COALESCE(SUM(fr.Required_quantity), 0) AS totalRequestedQuantity
      FROM Beneficiary b
      LEFT JOIN Food_request fr ON b.Beneficiary_id = fr.Beneficiary_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (b.Name LIKE ? OR b.Phone LIKE ? OR b.Email LIKE ? OR b.Address LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (status) {
      query += ` AND b.Verified_status = ?`;
      params.push(status);
    }

    query += `
      GROUP BY b.Beneficiary_id, b.Name, b.Phone, b.Email, b.Address, b.Head_count, b.Verified_status
      ORDER BY b.Beneficiary_id DESC
    `;

    const [beneficiaries] = await pool.query(query, params);
    res.json({ success: true, data: beneficiaries });
  } catch (error) {
    next(error);
  }
};

// GET /api/beneficiaries/:id
exports.getBeneficiaryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [beneficiaries] = await pool.query(
      `SELECT * FROM Beneficiary WHERE Beneficiary_id = ?`,
      [id]
    );

    if (beneficiaries.length === 0) {
      return res.status(404).json({ success: false, message: 'Beneficiary not found' });
    }

    // Food requests made by this beneficiary
    const [requests] = await pool.query(
      `SELECT 
        fr.Request_id,
        fr.Request_DateTime,
        fr.Required_by,
        fr.Required_quantity,
        fr.Status,
        fi.Item_name,
        fi.Unit,
        ngo.Name AS ngoName,
        COALESCE(SUM(d.Quantity), 0) AS fulfilledQuantity
      FROM Food_request fr
      JOIN NGO ngo ON fr.NGO_id = ngo.NGO_id
      LEFT JOIN Food_item fi ON fr.Item_id = fi.Item_id
      LEFT JOIN Delivery d ON fr.Request_id = d.Request_id AND d.Status = 'Delivered'
      WHERE fr.Beneficiary_id = ?
      GROUP BY fr.Request_id, fr.Request_DateTime, fr.Required_by, fr.Required_quantity, fr.Status, fi.Item_name, fi.Unit, ngo.Name
      ORDER BY fr.Request_DateTime DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...beneficiaries[0],
        requests
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/beneficiaries
exports.createBeneficiary = async (req, res, next) => {
  try {
    const { Name, Phone, Email, Address, Head_count, Verified_status } = req.body;

    if (!Name || !Phone || !Address || !Head_count) {
      return res.status(400).json({
        success: false,
        message: 'Name, Phone, Address, and Head_count are required.'
      });
    }

    if (parseInt(Head_count, 10) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Head_count must be a positive integer (> 0).'
      });
    }

    const validStatuses = ['Pending', 'Verified', 'Rejected'];
    const status = validStatuses.includes(Verified_status) ? Verified_status : 'Pending';

    const [result] = await pool.query(
      `INSERT INTO Beneficiary (Name, Phone, Email, Address, Head_count, Verified_status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        Name.trim(),
        Phone.trim(),
        Email ? Email.trim() : null,
        Address.trim(),
        parseInt(Head_count, 10),
        status
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Beneficiary registered successfully',
      data: { Beneficiary_id: result.insertId }
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/beneficiaries/:id
exports.updateBeneficiary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { Name, Phone, Email, Address, Head_count, Verified_status } = req.body;

    if (!Name || !Phone || !Address || !Head_count) {
      return res.status(400).json({
        success: false,
        message: 'Name, Phone, Address, and Head_count are required.'
      });
    }

    if (parseInt(Head_count, 10) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Head_count must be greater than 0.'
      });
    }

    const validStatuses = ['Pending', 'Verified', 'Rejected'];
    const status = validStatuses.includes(Verified_status) ? Verified_status : 'Pending';

    const [result] = await pool.query(
      `UPDATE Beneficiary 
       SET Name = ?, Phone = ?, Email = ?, Address = ?, Head_count = ?, Verified_status = ?
       WHERE Beneficiary_id = ?`,
      [
        Name.trim(),
        Phone.trim(),
        Email ? Email.trim() : null,
        Address.trim(),
        parseInt(Head_count, 10),
        status,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Beneficiary not found' });
    }

    res.json({ success: true, message: 'Beneficiary updated successfully' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/beneficiaries/:id/status
exports.updateVerificationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { Verified_status } = req.body;

    const validStatuses = ['Pending', 'Verified', 'Rejected'];
    if (!validStatuses.includes(Verified_status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Pending, Verified, or Rejected.'
      });
    }

    const [result] = await pool.query(
      `UPDATE Beneficiary SET Verified_status = ? WHERE Beneficiary_id = ?`,
      [Verified_status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Beneficiary not found' });
    }

    res.json({ success: true, message: `Status updated to ${Verified_status}` });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/beneficiaries/:id
exports.deleteBeneficiary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(`DELETE FROM Beneficiary WHERE Beneficiary_id = ?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Beneficiary not found' });
    }

    res.json({ success: true, message: 'Beneficiary deleted successfully' });
  } catch (error) {
    next(error);
  }
};
