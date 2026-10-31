const { pool } = require('../config/db');

// Helper to validate delivery constraints
function validateDeliveryPayload(data) {
  const {
    Donation_id,
    Delivery_partner_id,
    NGO_id,
    Quantity,
    Beneficiary_id,
    Unit_id,
    Request_id,
    Pickup_DateTime,
    Delivery_DateTime
  } = data;

  if (!Donation_id || !Delivery_partner_id || !NGO_id || !Quantity) {
    return 'Donation_id, Delivery_partner_id, NGO_id, and Quantity are required.';
  }

  if (parseFloat(Quantity) <= 0) {
    return 'Quantity must be greater than 0.';
  }

  const hasBeneficiary = Beneficiary_id !== undefined && Beneficiary_id !== null && Beneficiary_id !== '';
  const hasUnit = Unit_id !== undefined && Unit_id !== null && Unit_id !== '';
  const hasRequest = Request_id !== undefined && Request_id !== null && Request_id !== '';

  // Constraint 1: Exactly ONE destination: either Beneficiary OR Storage Unit
  if ((hasBeneficiary && hasUnit) || (!hasBeneficiary && !hasUnit)) {
    return 'A delivery must have exactly one destination: either Beneficiary or Storage Unit, never both or neither.';
  }

  // Constraint 2: Beneficiary delivery <=> has Request_id
  if (hasBeneficiary && !hasRequest) {
    return 'A delivery to a Beneficiary must be associated with a valid Food Request.';
  }
  if (hasUnit && hasRequest) {
    return 'A delivery to a Storage Unit must NOT be linked to a Beneficiary Food Request.';
  }

  // Constraint 3: Delivery time >= Pickup time
  if (Pickup_DateTime && Delivery_DateTime) {
    const pickup = new Date(Pickup_DateTime);
    const delivery = new Date(Delivery_DateTime);
    if (delivery < pickup) {
      return 'Delivery time cannot be earlier than Pickup time.';
    }
  }

  return null;
}

// GET /api/deliveries
exports.getAllDeliveries = async (req, res, next) => {
  try {
    const { status, ngoId, partnerId, destinationType, search } = req.query;

    let query = `
      SELECT 
        del.Delivery_id,
        del.Donation_id,
        del.Request_id,
        del.Quantity,
        del.Pickup_DateTime,
        del.Delivery_DateTime,
        del.Status,
        TIMESTAMPDIFF(MINUTE, del.Pickup_DateTime, del.Delivery_DateTime) AS transitMinutes,
        fi.Item_name AS itemName,
        fi.Category AS category,
        fi.Unit AS unit,
        dn.Name AS donorName,
        dn.Phone AS donorPhone,
        ngo.NGO_id,
        ngo.Name AS ngoName,
        dp.Partner_id AS partnerId,
        dp.Name AS partnerName,
        dp.Phone AS partnerPhone,
        v.Vehicle_no AS vehicleNo,
        v.Vehicle_type AS vehicleType,
        v.Is_Refrigerated AS isRefrigerated,
        del.Beneficiary_id,
        b.Name AS beneficiaryName,
        b.Address AS beneficiaryAddress,
        del.Unit_id,
        su.Unit_name AS unitName,
        su.Location AS unitLocation,
        CASE 
          WHEN del.Beneficiary_id IS NOT NULL THEN 'Beneficiary' 
          ELSE 'Storage Unit' 
        END AS destinationType,
        COALESCE(b.Name, su.Unit_name) AS destinationName,
        DATE_ADD(fd.Donation_DateTime, INTERVAL fi.Expiry_Period_Hours HOUR) AS foodExpiresAt,
        CASE 
          WHEN del.Delivery_DateTime IS NULL THEN 'Pending Delivery'
          WHEN del.Delivery_DateTime <= DATE_ADD(fd.Donation_DateTime, INTERVAL fi.Expiry_Period_Hours HOUR) THEN 'Within Shelf Life'
          ELSE 'Delivered After Expiry'
        END AS freshnessCheck
      FROM Delivery del
      JOIN Food_donation fd ON del.Donation_id = fd.Donation_id
      JOIN Food_item fi ON fd.Item_id = fi.Item_id
      JOIN Donor dn ON fd.Donor_id = dn.Donor_id
      JOIN NGO ngo ON del.NGO_id = ngo.NGO_id
      JOIN Delivery_partner dp ON del.Delivery_partner_id = dp.Partner_id
      LEFT JOIN Vehicle v ON dp.Partner_id = v.Partner_id
      LEFT JOIN Beneficiary b ON del.Beneficiary_id = b.Beneficiary_id
      LEFT JOIN Storage_Unit su ON del.Unit_id = su.Unit_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND del.Status = ?`;
      params.push(status);
    }

    if (ngoId) {
      query += ` AND del.NGO_id = ?`;
      params.push(ngoId);
    }

    if (partnerId) {
      query += ` AND del.Delivery_partner_id = ?`;
      params.push(partnerId);
    }

    if (destinationType === 'Beneficiary') {
      query += ` AND del.Beneficiary_id IS NOT NULL`;
    } else if (destinationType === 'Storage Unit') {
      query += ` AND del.Unit_id IS NOT NULL`;
    }

    if (search) {
      query += ` AND (dp.Name LIKE ? OR dn.Name LIKE ? OR fi.Item_name LIKE ? OR b.Name LIKE ? OR su.Unit_name LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term, term);
    }

    query += ` ORDER BY del.Delivery_id DESC`;

    const [deliveries] = await pool.query(query, params);
    res.json({ success: true, data: deliveries });
  } catch (error) {
    next(error);
  }
};

// GET /api/deliveries/:id
exports.getDeliveryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [deliveries] = await pool.query(
      `SELECT 
        del.Delivery_id,
        del.Donation_id,
        del.Request_id,
        del.Quantity,
        del.Pickup_DateTime,
        del.Delivery_DateTime,
        del.Status,
        TIMESTAMPDIFF(MINUTE, del.Pickup_DateTime, del.Delivery_DateTime) AS transitMinutes,
        fi.Item_name AS itemName,
        fi.Category AS category,
        fi.Unit AS unit,
        dn.Donor_id,
        dn.Name AS donorName,
        dn.Phone AS donorPhone,
        dn.Address AS donorAddress,
        ngo.NGO_id,
        ngo.Name AS ngoName,
        dp.Partner_id AS partnerId,
        dp.Name AS partnerName,
        dp.Phone AS partnerPhone,
        dp.Type AS partnerType,
        v.Vehicle_no AS vehicleNo,
        v.Vehicle_type AS vehicleType,
        v.Capacity AS vehicleCapacity,
        v.Is_Refrigerated AS isRefrigerated,
        del.Beneficiary_id,
        b.Name AS beneficiaryName,
        b.Address AS beneficiaryAddress,
        del.Unit_id,
        su.Unit_name AS unitName,
        su.Location AS unitLocation,
        CASE 
          WHEN del.Beneficiary_id IS NOT NULL THEN 'Beneficiary' 
          ELSE 'Storage Unit' 
        END AS destinationType,
        COALESCE(b.Name, su.Unit_name) AS destinationName,
        DATE_ADD(fd.Donation_DateTime, INTERVAL fi.Expiry_Period_Hours HOUR) AS foodExpiresAt,
        CASE 
          WHEN del.Delivery_DateTime IS NULL THEN 'Pending Delivery'
          WHEN del.Delivery_DateTime <= DATE_ADD(fd.Donation_DateTime, INTERVAL fi.Expiry_Period_Hours HOUR) THEN 'Within Shelf Life'
          ELSE 'Delivered After Expiry'
        END AS freshnessCheck
      FROM Delivery del
      JOIN Food_donation fd ON del.Donation_id = fd.Donation_id
      JOIN Food_item fi ON fd.Item_id = fi.Item_id
      JOIN Donor dn ON fd.Donor_id = dn.Donor_id
      JOIN NGO ngo ON del.NGO_id = ngo.NGO_id
      JOIN Delivery_partner dp ON del.Delivery_partner_id = dp.Partner_id
      LEFT JOIN Vehicle v ON dp.Partner_id = v.Partner_id
      LEFT JOIN Beneficiary b ON del.Beneficiary_id = b.Beneficiary_id
      LEFT JOIN Storage_Unit su ON del.Unit_id = su.Unit_id
      WHERE del.Delivery_id = ?`,
      [id]
    );

    if (deliveries.length === 0) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    res.json({ success: true, data: deliveries[0] });
  } catch (error) {
    next(error);
  }
};

// POST /api/deliveries
exports.createDelivery = async (req, res, next) => {
  try {
    const validationError = validateDeliveryPayload(req.body);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const {
      Donation_id,
      Request_id,
      Quantity,
      Delivery_partner_id,
      NGO_id,
      Beneficiary_id,
      Unit_id,
      Pickup_DateTime,
      Delivery_DateTime,
      Status
    } = req.body;

    const validStatuses = ['Assigned', 'Picked Up', 'In Transit', 'Delivered', 'Cancelled'];
    const deliveryStatus = validStatuses.includes(Status) ? Status : 'Assigned';

    const [result] = await pool.query(
      `INSERT INTO Delivery 
        (Donation_id, Request_id, Quantity, Delivery_partner_id, NGO_id, Beneficiary_id, Unit_id, Pickup_DateTime, Delivery_DateTime, Status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        parseInt(Donation_id, 10),
        Request_id ? parseInt(Request_id, 10) : null,
        parseFloat(Quantity),
        parseInt(Delivery_partner_id, 10),
        parseInt(NGO_id, 10),
        Beneficiary_id ? parseInt(Beneficiary_id, 10) : null,
        Unit_id ? parseInt(Unit_id, 10) : null,
        Pickup_DateTime || null,
        Delivery_DateTime || null,
        deliveryStatus
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Delivery created successfully',
      data: { Delivery_id: result.insertId }
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/deliveries/:id
exports.updateDelivery = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validationError = validateDeliveryPayload(req.body);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const {
      Donation_id,
      Request_id,
      Quantity,
      Delivery_partner_id,
      NGO_id,
      Beneficiary_id,
      Unit_id,
      Pickup_DateTime,
      Delivery_DateTime,
      Status
    } = req.body;

    const validStatuses = ['Assigned', 'Picked Up', 'In Transit', 'Delivered', 'Cancelled'];
    const deliveryStatus = validStatuses.includes(Status) ? Status : 'Assigned';

    const [result] = await pool.query(
      `UPDATE Delivery 
       SET Donation_id = ?, Request_id = ?, Quantity = ?, Delivery_partner_id = ?, 
           NGO_id = ?, Beneficiary_id = ?, Unit_id = ?, Pickup_DateTime = ?, Delivery_DateTime = ?, Status = ?
       WHERE Delivery_id = ?`,
      [
        parseInt(Donation_id, 10),
        Request_id ? parseInt(Request_id, 10) : null,
        parseFloat(Quantity),
        parseInt(Delivery_partner_id, 10),
        parseInt(NGO_id, 10),
        Beneficiary_id ? parseInt(Beneficiary_id, 10) : null,
        Unit_id ? parseInt(Unit_id, 10) : null,
        Pickup_DateTime || null,
        Delivery_DateTime || null,
        deliveryStatus,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    res.json({ success: true, message: 'Delivery updated successfully' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/deliveries/:id/status
exports.updateDeliveryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { Status, Pickup_DateTime, Delivery_DateTime } = req.body;

    const validStatuses = ['Assigned', 'Picked Up', 'In Transit', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(Status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Assigned, Picked Up, In Transit, Delivered, or Cancelled.'
      });
    }

    let query = `UPDATE Delivery SET Status = ?`;
    const params = [Status];

    if (Pickup_DateTime !== undefined) {
      query += `, Pickup_DateTime = ?`;
      params.push(Pickup_DateTime || null);
    }
    if (Delivery_DateTime !== undefined) {
      query += `, Delivery_DateTime = ?`;
      params.push(Delivery_DateTime || null);
    }

    query += ` WHERE Delivery_id = ?`;
    params.push(id);

    const [result] = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    res.json({ success: true, message: `Delivery status updated to ${Status}` });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/deliveries/:id
exports.deleteDelivery = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(`DELETE FROM Delivery WHERE Delivery_id = ?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    res.json({ success: true, message: 'Delivery deleted successfully' });
  } catch (error) {
    next(error);
  }
};
