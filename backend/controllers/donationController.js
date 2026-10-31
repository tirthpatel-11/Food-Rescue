const { pool } = require('../config/db');

// GET /api/donations
exports.getAllDonations = async (req, res, next) => {
  try {
    const { status, donorId, ngoId, search, dateFrom, dateTo } = req.query;

    let query = `
      SELECT 
        fd.Donation_id,
        fd.Quantity,
        fd.Status,
        fd.Donation_DateTime,
        fd.Pickup_window,
        fd.Pickup_DateTime,
        dn.Donor_id,
        dn.Name AS donorName,
        dn.Phone AS donorPhone,
        dn.Donor_Type AS donorType,
        fi.Item_id,
        fi.Item_name AS itemName,
        fi.Category AS category,
        fi.Unit AS unit,
        fi.Expiry_Period_Hours AS expiryHours,
        DATE_ADD(fd.Donation_DateTime, INTERVAL fi.Expiry_Period_Hours HOUR) AS Expiry_DateTime,
        CASE 
          WHEN NOW() > DATE_ADD(fd.Donation_DateTime, INTERVAL fi.Expiry_Period_Hours HOUR) THEN 1 
          ELSE 0 
        END AS isExpired,
        n.NGO_id,
        n.Name AS ngoName,
        su.Unit_id,
        su.Unit_name AS unitName,
        COALESCE(SUM(CASE WHEN del.Status = 'Delivered' THEN del.Quantity END), 0) AS deliveredQuantity,
        COALESCE(SUM(CASE WHEN del.Status IN ('Assigned', 'Picked Up', 'In Transit') THEN del.Quantity END), 0) AS inProgressQuantity,
        fd.Quantity - COALESCE(SUM(CASE WHEN del.Status <> 'Cancelled' THEN del.Quantity END), 0) AS remainingQuantity,
        COUNT(del.Delivery_id) AS deliveryCount
      FROM Food_donation fd
      JOIN Donor dn ON fd.Donor_id = dn.Donor_id
      JOIN Food_item fi ON fd.Item_id = fi.Item_id
      LEFT JOIN NGO n ON fd.NGO_id = n.NGO_id
      LEFT JOIN Storage_Unit su ON fd.Unit_id = su.Unit_id
      LEFT JOIN Delivery del ON fd.Donation_id = del.Donation_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND fd.Status = ?`;
      params.push(status);
    }

    if (donorId) {
      query += ` AND fd.Donor_id = ?`;
      params.push(donorId);
    }

    if (ngoId) {
      query += ` AND fd.NGO_id = ?`;
      params.push(ngoId);
    }

    if (dateFrom) {
      query += ` AND fd.Donation_DateTime >= ?`;
      params.push(dateFrom);
    }

    if (dateTo) {
      query += ` AND fd.Donation_DateTime <= ?`;
      params.push(dateTo);
    }

    if (search) {
      query += ` AND (dn.Name LIKE ? OR fi.Item_name LIKE ? OR n.Name LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += `
      GROUP BY 
        fd.Donation_id, fd.Quantity, fd.Status, fd.Donation_DateTime, fd.Pickup_window, fd.Pickup_DateTime,
        dn.Donor_id, dn.Name, dn.Phone, dn.Donor_Type,
        fi.Item_id, fi.Item_name, fi.Category, fi.Unit, fi.Expiry_Period_Hours,
        n.NGO_id, n.Name, su.Unit_id, su.Unit_name
      ORDER BY fd.Donation_id DESC
    `;

    const [donations] = await pool.query(query, params);
    res.json({ success: true, data: donations });
  } catch (error) {
    next(error);
  }
};

// GET /api/donations/:id
exports.getDonationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [donations] = await pool.query(
      `SELECT 
        fd.Donation_id,
        fd.Quantity,
        fd.Status,
        fd.Donation_DateTime,
        fd.Pickup_window,
        fd.Pickup_DateTime,
        dn.Donor_id,
        dn.Name AS donorName,
        dn.Phone AS donorPhone,
        dn.Email AS donorEmail,
        dn.Address AS donorAddress,
        dn.Donor_Type AS donorType,
        fi.Item_id,
        fi.Item_name AS itemName,
        fi.Category AS category,
        fi.Unit AS unit,
        fi.Expiry_Period_Hours AS expiryHours,
        DATE_ADD(fd.Donation_DateTime, INTERVAL fi.Expiry_Period_Hours HOUR) AS Expiry_DateTime,
        n.NGO_id,
        n.Name AS ngoName,
        su.Unit_id,
        su.Unit_name AS unitName
      FROM Food_donation fd
      JOIN Donor dn ON fd.Donor_id = dn.Donor_id
      JOIN Food_item fi ON fd.Item_id = fi.Item_id
      LEFT JOIN NGO n ON fd.NGO_id = n.NGO_id
      LEFT JOIN Storage_Unit su ON fd.Unit_id = su.Unit_id
      WHERE fd.Donation_id = ?`,
      [id]
    );

    if (donations.length === 0) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    // Deliveries associated with this donation
    const [deliveries] = await pool.query(
      `SELECT 
        del.Delivery_id,
        del.Quantity,
        del.Status,
        del.Pickup_DateTime,
        del.Delivery_DateTime,
        del.Request_id,
        dp.Name AS partnerName,
        v.Vehicle_no,
        v.Vehicle_type,
        CASE WHEN del.Beneficiary_id IS NOT NULL THEN 'Beneficiary' ELSE 'Storage Unit' END AS destinationType,
        COALESCE(b.Name, su.Unit_name) AS destinationName
      FROM Delivery del
      JOIN Delivery_partner dp ON del.Delivery_partner_id = dp.Partner_id
      LEFT JOIN Vehicle v ON v.Partner_id = dp.Partner_id
      LEFT JOIN Beneficiary b ON del.Beneficiary_id = b.Beneficiary_id
      LEFT JOIN Storage_Unit su ON del.Unit_id = su.Unit_id
      WHERE del.Donation_id = ?
      ORDER BY del.Delivery_id DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...donations[0],
        deliveries
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/donations
exports.createDonation = async (req, res, next) => {
  try {
    const {
      Donor_id,
      Item_id,
      Quantity,
      NGO_id,
      Unit_id,
      Pickup_window,
      Pickup_DateTime,
      Status
    } = req.body;

    if (!Donor_id || !Item_id || !Quantity || !Pickup_window) {
      return res.status(400).json({
        success: false,
        message: 'Donor_id, Item_id, Quantity, and Pickup_window are required.'
      });
    }

    if (parseFloat(Quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0.'
      });
    }

    const validStatuses = ['Pending', 'Accepted', 'Collected', 'Delivered', 'Cancelled'];
    const donationStatus = validStatuses.includes(Status) ? Status : 'Pending';

    const [result] = await pool.query(
      `INSERT INTO Food_donation 
        (Donor_id, Item_id, Quantity, NGO_id, Unit_id, Pickup_window, Pickup_DateTime, Status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        parseInt(Donor_id, 10),
        parseInt(Item_id, 10),
        parseFloat(Quantity),
        NGO_id ? parseInt(NGO_id, 10) : null,
        Unit_id ? parseInt(Unit_id, 10) : null,
        Pickup_window.trim(),
        Pickup_DateTime || null,
        donationStatus
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Food donation recorded successfully',
      data: { Donation_id: result.insertId }
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/donations/:id
exports.updateDonation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      Donor_id,
      Item_id,
      Quantity,
      NGO_id,
      Unit_id,
      Pickup_window,
      Pickup_DateTime,
      Status
    } = req.body;

    if (!Donor_id || !Item_id || !Quantity || !Pickup_window) {
      return res.status(400).json({
        success: false,
        message: 'Donor_id, Item_id, Quantity, and Pickup_window are required.'
      });
    }

    if (parseFloat(Quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0.'
      });
    }

    const validStatuses = ['Pending', 'Accepted', 'Collected', 'Delivered', 'Cancelled'];
    const donationStatus = validStatuses.includes(Status) ? Status : 'Pending';

    const [result] = await pool.query(
      `UPDATE Food_donation 
       SET Donor_id = ?, Item_id = ?, Quantity = ?, NGO_id = ?, Unit_id = ?, 
           Pickup_window = ?, Pickup_DateTime = ?, Status = ?
       WHERE Donation_id = ?`,
      [
        parseInt(Donor_id, 10),
        parseInt(Item_id, 10),
        parseFloat(Quantity),
        NGO_id ? parseInt(NGO_id, 10) : null,
        Unit_id ? parseInt(Unit_id, 10) : null,
        Pickup_window.trim(),
        Pickup_DateTime || null,
        donationStatus,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    res.json({ success: true, message: 'Food donation updated successfully' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/donations/:id/status
exports.updateDonationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { Status, NGO_id, Unit_id, Pickup_DateTime } = req.body;

    const validStatuses = ['Pending', 'Accepted', 'Collected', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(Status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Pending, Accepted, Collected, Delivered, or Cancelled.'
      });
    }

    let query = `UPDATE Food_donation SET Status = ?`;
    const params = [Status];

    if (NGO_id !== undefined) {
      query += `, NGO_id = ?`;
      params.push(NGO_id ? parseInt(NGO_id, 10) : null);
    }
    if (Unit_id !== undefined) {
      query += `, Unit_id = ?`;
      params.push(Unit_id ? parseInt(Unit_id, 10) : null);
    }
    if (Pickup_DateTime !== undefined) {
      query += `, Pickup_DateTime = ?`;
      params.push(Pickup_DateTime || null);
    }

    query += ` WHERE Donation_id = ?`;
    params.push(id);

    const [result] = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    res.json({ success: true, message: `Donation status updated to ${Status}` });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/donations/:id
exports.deleteDonation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(`DELETE FROM Food_donation WHERE Donation_id = ?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    res.json({ success: true, message: 'Food donation deleted successfully' });
  } catch (error) {
    next(error);
  }
};
