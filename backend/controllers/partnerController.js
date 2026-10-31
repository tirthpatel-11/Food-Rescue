const { pool } = require('../config/db');

// GET /api/partners
exports.getAllPartners = async (req, res, next) => {
  try {
    const { ngoId, type, search } = req.query;

    let query = `
      SELECT 
        dp.Partner_id,
        dp.Name,
        dp.Phone,
        dp.Email,
        dp.License_no,
        dp.Type,
        dp.NGO_id,
        ngo.Name AS ngoName,
        v.Vehicle_id,
        v.Vehicle_no,
        v.Vehicle_type,
        v.Capacity,
        v.Is_Refrigerated,
        COUNT(del.Delivery_id) AS totalDeliveries,
        COALESCE(SUM(CASE WHEN del.Status = 'Delivered' THEN 1 ELSE 0 END), 0) AS completedDeliveries,
        COALESCE(SUM(CASE WHEN del.Status IN ('Assigned', 'Picked Up', 'In Transit') THEN 1 ELSE 0 END), 0) AS activeDeliveries
      FROM Delivery_partner dp
      LEFT JOIN NGO ngo ON dp.NGO_id = ngo.NGO_id
      LEFT JOIN Vehicle v ON dp.Partner_id = v.Partner_id
      LEFT JOIN Delivery del ON dp.Partner_id = del.Delivery_partner_id
      WHERE 1=1
    `;
    const params = [];

    if (ngoId) {
      query += ` AND dp.NGO_id = ?`;
      params.push(ngoId);
    }

    if (type) {
      query += ` AND dp.Type = ?`;
      params.push(type);
    }

    if (search) {
      query += ` AND (dp.Name LIKE ? OR dp.Phone LIKE ? OR dp.Email LIKE ? OR v.Vehicle_no LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    query += `
      GROUP BY 
        dp.Partner_id, dp.Name, dp.Phone, dp.Email, dp.License_no, dp.Type, dp.NGO_id, ngo.Name,
        v.Vehicle_id, v.Vehicle_no, v.Vehicle_type, v.Capacity, v.Is_Refrigerated
      ORDER BY dp.Partner_id DESC
    `;

    const [partners] = await pool.query(query, params);
    res.json({ success: true, data: partners });
  } catch (error) {
    next(error);
  }
};

// GET /api/partners/:id
exports.getPartnerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [partners] = await pool.query(
      `SELECT 
        dp.Partner_id,
        dp.Name,
        dp.Phone,
        dp.Email,
        dp.License_no,
        dp.Type,
        dp.NGO_id,
        ngo.Name AS ngoName,
        v.Vehicle_id,
        v.Vehicle_no,
        v.Vehicle_type,
        v.Capacity,
        v.Is_Refrigerated
      FROM Delivery_partner dp
      LEFT JOIN NGO ngo ON dp.NGO_id = ngo.NGO_id
      LEFT JOIN Vehicle v ON dp.Partner_id = v.Partner_id
      WHERE dp.Partner_id = ?`,
      [id]
    );

    if (partners.length === 0) {
      return res.status(404).json({ success: false, message: 'Delivery partner not found' });
    }

    // Deliveries assigned to this partner
    const [deliveries] = await pool.query(
      `SELECT 
        del.Delivery_id,
        del.Quantity,
        del.Status,
        del.Pickup_DateTime,
        del.Delivery_DateTime,
        fi.Item_name,
        fi.Unit,
        ngo.Name AS ngoName,
        CASE WHEN del.Beneficiary_id IS NOT NULL THEN 'Beneficiary' ELSE 'Storage Unit' END AS destinationType,
        COALESCE(b.Name, su.Unit_name) AS destinationName
      FROM Delivery del
      JOIN Food_donation fd ON del.Donation_id = fd.Donation_id
      JOIN Food_item fi ON fd.Item_id = fi.Item_id
      JOIN NGO ngo ON del.NGO_id = ngo.NGO_id
      LEFT JOIN Beneficiary b ON del.Beneficiary_id = b.Beneficiary_id
      LEFT JOIN Storage_Unit su ON del.Unit_id = su.Unit_id
      WHERE del.Delivery_partner_id = ?
      ORDER BY del.Delivery_id DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...partners[0],
        deliveries
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/partners (Transaction: inserts Delivery_partner and associated Vehicle)
exports.createPartner = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const {
      Name,
      Phone,
      Email,
      License_no,
      Type,
      NGO_id,
      // Vehicle details
      Vehicle_no,
      Vehicle_type,
      Capacity,
      Is_Refrigerated
    } = req.body;

    if (!Name || !Phone || !Type) {
      return res.status(400).json({
        success: false,
        message: 'Name, Phone, and Type are required for delivery partner.'
      });
    }

    const validTypes = ['Volunteer', 'Partner'];
    if (!validTypes.includes(Type)) {
      return res.status(400).json({
        success: false,
        message: 'Partner Type must be either Volunteer or Partner.'
      });
    }

    await connection.beginTransaction();

    // 1. Insert Delivery Partner
    const [partnerResult] = await connection.query(
      `INSERT INTO Delivery_partner (Name, Phone, Email, License_no, Type, NGO_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        Name.trim(),
        Phone.trim(),
        Email ? Email.trim() : null,
        License_no ? License_no.trim() : null,
        Type,
        NGO_id ? parseInt(NGO_id, 10) : null
      ]
    );

    const partnerId = partnerResult.insertId;

    // 2. Insert Vehicle (if vehicle details provided)
    let vehicleId = null;
    if (Vehicle_no && Vehicle_type && Capacity) {
      if (parseFloat(Capacity) <= 0) {
        throw new Error('Vehicle capacity must be greater than 0.');
      }

      const [vehicleResult] = await connection.query(
        `INSERT INTO Vehicle (Partner_id, Vehicle_no, Vehicle_type, Capacity, Is_Refrigerated)
         VALUES (?, ?, ?, ?, ?)`,
        [
          partnerId,
          Vehicle_no.trim().toUpperCase(),
          Vehicle_type.trim(),
          parseFloat(Capacity),
          Boolean(Is_Refrigerated)
        ]
      );
      vehicleId = vehicleResult.insertId;
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Delivery partner and vehicle registered successfully',
      data: {
        Partner_id: partnerId,
        Vehicle_id: vehicleId
      }
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// PUT /api/partners/:id (Updates partner and vehicle info)
exports.updatePartner = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const {
      Name,
      Phone,
      Email,
      License_no,
      Type,
      NGO_id,
      Vehicle_no,
      Vehicle_type,
      Capacity,
      Is_Refrigerated
    } = req.body;

    if (!Name || !Phone || !Type) {
      return res.status(400).json({
        success: false,
        message: 'Name, Phone, and Type are required.'
      });
    }

    await connection.beginTransaction();

    // 1. Update Partner
    const [partnerResult] = await connection.query(
      `UPDATE Delivery_partner 
       SET Name = ?, Phone = ?, Email = ?, License_no = ?, Type = ?, NGO_id = ?
       WHERE Partner_id = ?`,
      [
        Name.trim(),
        Phone.trim(),
        Email ? Email.trim() : null,
        License_no ? License_no.trim() : null,
        Type,
        NGO_id ? parseInt(NGO_id, 10) : null,
        id
      ]
    );

    if (partnerResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }

    // 2. Handle Vehicle update or create
    if (Vehicle_no && Vehicle_type && Capacity) {
      if (parseFloat(Capacity) <= 0) {
        throw new Error('Vehicle capacity must be greater than 0.');
      }

      // Check if vehicle exists for partner
      const [existingVehicles] = await connection.query(
        `SELECT Vehicle_id FROM Vehicle WHERE Partner_id = ?`,
        [id]
      );

      if (existingVehicles.length > 0) {
        await connection.query(
          `UPDATE Vehicle 
           SET Vehicle_no = ?, Vehicle_type = ?, Capacity = ?, Is_Refrigerated = ?
           WHERE Partner_id = ?`,
          [
            Vehicle_no.trim().toUpperCase(),
            Vehicle_type.trim(),
            parseFloat(Capacity),
            Boolean(Is_Refrigerated),
            id
          ]
        );
      } else {
        await connection.query(
          `INSERT INTO Vehicle (Partner_id, Vehicle_no, Vehicle_type, Capacity, Is_Refrigerated)
           VALUES (?, ?, ?, ?, ?)`,
          [
            id,
            Vehicle_no.trim().toUpperCase(),
            Vehicle_type.trim(),
            parseFloat(Capacity),
            Boolean(Is_Refrigerated)
          ]
        );
      }
    }

    await connection.commit();
    res.json({ success: true, message: 'Delivery partner and vehicle updated successfully' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// DELETE /api/partners/:id
exports.deletePartner = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Note: Due to ON DELETE CASCADE on Vehicle, the vehicle will be removed automatically
    const [result] = await pool.query(`DELETE FROM Delivery_partner WHERE Partner_id = ?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Delivery partner not found' });
    }

    res.json({ success: true, message: 'Delivery partner and vehicle deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// GET /api/partners/vehicles/all
exports.getAllVehicles = async (req, res, next) => {
  try {
    const [vehicles] = await pool.query(`
      SELECT 
        v.Vehicle_id,
        v.Vehicle_no,
        v.Vehicle_type,
        v.Capacity,
        v.Is_Refrigerated,
        dp.Partner_id,
        dp.Name AS partnerName,
        dp.Phone AS partnerPhone,
        ngo.Name AS ngoName
      FROM Vehicle v
      JOIN Delivery_partner dp ON v.Partner_id = dp.Partner_id
      LEFT JOIN NGO ngo ON dp.NGO_id = ngo.NGO_id
      ORDER BY v.Vehicle_id DESC
    `);
    res.json({ success: true, data: vehicles });
  } catch (error) {
    next(error);
  }
};
