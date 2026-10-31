const { pool } = require('../config/db');

// GET /api/requests
exports.getAllRequests = async (req, res, next) => {
  try {
    const { status, beneficiaryId, ngoId, search } = req.query;

    let query = `
      SELECT 
        fr.Request_id,
        fr.Request_DateTime,
        fr.Required_by,
        fr.Required_quantity,
        fr.Status,
        b.Beneficiary_id,
        b.Name AS beneficiaryName,
        b.Phone AS beneficiaryPhone,
        b.Head_count AS headCount,
        b.Verified_status AS verifiedStatus,
        n.NGO_id,
        n.Name AS ngoName,
        fi.Item_id,
        COALESCE(fi.Item_name, 'Any Food') AS itemName,
        fi.Category AS category,
        COALESCE(fi.Unit, 'units') AS unit,
        COALESCE(SUM(CASE WHEN del.Status = 'Delivered' THEN del.Quantity END), 0) AS fulfilledQuantity,
        fr.Required_quantity - COALESCE(SUM(CASE WHEN del.Status = 'Delivered' THEN del.Quantity END), 0) AS remainingQuantity,
        COUNT(del.Delivery_id) AS deliveryCount
      FROM Food_request fr
      JOIN Beneficiary b ON fr.Beneficiary_id = b.Beneficiary_id
      JOIN NGO n ON fr.NGO_id = n.NGO_id
      LEFT JOIN Food_item fi ON fr.Item_id = fi.Item_id
      LEFT JOIN Delivery del ON fr.Request_id = del.Request_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND fr.Status = ?`;
      params.push(status);
    }

    if (beneficiaryId) {
      query += ` AND fr.Beneficiary_id = ?`;
      params.push(beneficiaryId);
    }

    if (ngoId) {
      query += ` AND fr.NGO_id = ?`;
      params.push(ngoId);
    }

    if (search) {
      query += ` AND (b.Name LIKE ? OR n.Name LIKE ? OR fi.Item_name LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += `
      GROUP BY 
        fr.Request_id, fr.Request_DateTime, fr.Required_by, fr.Required_quantity, fr.Status,
        b.Beneficiary_id, b.Name, b.Phone, b.Head_count, b.Verified_status,
        n.NGO_id, n.Name, fi.Item_id, fi.Item_name, fi.Category, fi.Unit
      ORDER BY fr.Request_id DESC
    `;

    const [requests] = await pool.query(query, params);
    res.json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
};

// GET /api/requests/:id
exports.getRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [requests] = await pool.query(
      `SELECT 
        fr.Request_id,
        fr.Request_DateTime,
        fr.Required_by,
        fr.Required_quantity,
        fr.Status,
        b.Beneficiary_id,
        b.Name AS beneficiaryName,
        b.Phone AS beneficiaryPhone,
        b.Email AS beneficiaryEmail,
        b.Address AS beneficiaryAddress,
        b.Head_count AS headCount,
        b.Verified_status AS verifiedStatus,
        n.NGO_id,
        n.Name AS ngoName,
        fi.Item_id,
        COALESCE(fi.Item_name, 'Any Food') AS itemName,
        fi.Category AS category,
        COALESCE(fi.Unit, 'units') AS unit
      FROM Food_request fr
      JOIN Beneficiary b ON fr.Beneficiary_id = b.Beneficiary_id
      JOIN NGO n ON fr.NGO_id = n.NGO_id
      LEFT JOIN Food_item fi ON fr.Item_id = fi.Item_id
      WHERE fr.Request_id = ?`,
      [id]
    );

    if (requests.length === 0) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Deliveries mapped to this request
    const [deliveries] = await pool.query(
      `SELECT 
        del.Delivery_id,
        del.Quantity,
        del.Status,
        del.Pickup_DateTime,
        del.Delivery_DateTime,
        del.Donation_id,
        dp.Name AS partnerName,
        v.Vehicle_no,
        v.Vehicle_type
      FROM Delivery del
      JOIN Delivery_partner dp ON del.Delivery_partner_id = dp.Partner_id
      LEFT JOIN Vehicle v ON v.Partner_id = dp.Partner_id
      WHERE del.Request_id = ?
      ORDER BY del.Delivery_id DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...requests[0],
        deliveries
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/requests
exports.createRequest = async (req, res, next) => {
  try {
    const {
      Beneficiary_id,
      NGO_id,
      Item_id,
      Required_by,
      Required_quantity,
      Status
    } = req.body;

    if (!Beneficiary_id || !NGO_id || !Required_by || !Required_quantity) {
      return res.status(400).json({
        success: false,
        message: 'Beneficiary_id, NGO_id, Required_by, and Required_quantity are required.'
      });
    }

    if (parseFloat(Required_quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Required_quantity must be greater than 0.'
      });
    }

    const validStatuses = ['Open', 'Accepted', 'Fulfilled', 'Cancelled'];
    const requestStatus = validStatuses.includes(Status) ? Status : 'Open';

    const [result] = await pool.query(
      `INSERT INTO Food_request 
        (Beneficiary_id, NGO_id, Item_id, Required_by, Required_quantity, Status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        parseInt(Beneficiary_id, 10),
        parseInt(NGO_id, 10),
        Item_id ? parseInt(Item_id, 10) : null,
        Required_by,
        parseFloat(Required_quantity),
        requestStatus
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Food request created successfully',
      data: { Request_id: result.insertId }
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/requests/:id
exports.updateRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      Beneficiary_id,
      NGO_id,
      Item_id,
      Required_by,
      Required_quantity,
      Status
    } = req.body;

    if (!Beneficiary_id || !NGO_id || !Required_by || !Required_quantity) {
      return res.status(400).json({
        success: false,
        message: 'Beneficiary_id, NGO_id, Required_by, and Required_quantity are required.'
      });
    }

    if (parseFloat(Required_quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Required_quantity must be greater than 0.'
      });
    }

    const validStatuses = ['Open', 'Accepted', 'Fulfilled', 'Cancelled'];
    const requestStatus = validStatuses.includes(Status) ? Status : 'Open';

    const [result] = await pool.query(
      `UPDATE Food_request 
       SET Beneficiary_id = ?, NGO_id = ?, Item_id = ?, Required_by = ?, Required_quantity = ?, Status = ?
       WHERE Request_id = ?`,
      [
        parseInt(Beneficiary_id, 10),
        parseInt(NGO_id, 10),
        Item_id ? parseInt(Item_id, 10) : null,
        Required_by,
        parseFloat(Required_quantity),
        requestStatus,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    res.json({ success: true, message: 'Food request updated successfully' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/requests/:id/status
exports.updateRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { Status } = req.body;

    const validStatuses = ['Open', 'Accepted', 'Fulfilled', 'Cancelled'];
    if (!validStatuses.includes(Status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Open, Accepted, Fulfilled, or Cancelled.'
      });
    }

    const [result] = await pool.query(
      `UPDATE Food_request SET Status = ? WHERE Request_id = ?`,
      [Status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    res.json({ success: true, message: `Request status updated to ${Status}` });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/requests/:id
exports.deleteRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(`DELETE FROM Food_request WHERE Request_id = ?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    res.json({ success: true, message: 'Food request deleted successfully' });
  } catch (error) {
    next(error);
  }
};
