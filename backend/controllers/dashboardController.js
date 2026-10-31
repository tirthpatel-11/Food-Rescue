const { pool } = require('../config/db');

// GET /api/dashboard/stats
exports.getDashboardStats = async (req, res, next) => {
  try {
    // 1. Core metric counts via SQL aggregation
    const [counts] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM Donor) AS totalDonors,
        (SELECT COUNT(*) FROM NGO) AS totalNGOs,
        (SELECT COUNT(*) FROM Beneficiary) AS totalBeneficiaries,
        (SELECT COUNT(*) FROM Food_donation) AS totalFoodDonations,
        (SELECT COUNT(*) FROM Food_request) AS totalFoodRequests,
        (SELECT COUNT(*) FROM Delivery) AS totalDeliveries,
        (SELECT COUNT(*) FROM Food_donation WHERE Status = 'Pending') AS pendingDonations,
        (SELECT COUNT(*) FROM Food_request WHERE Status = 'Open') AS openRequests,
        (SELECT COUNT(*) FROM Delivery WHERE Status = 'Delivered') AS completedDeliveries,
        (SELECT COUNT(*) FROM Delivery WHERE Status IN ('Assigned', 'Picked Up', 'In Transit')) AS activeDeliveries
    `);

    // 2. Donation status distribution
    const [donationsByStatus] = await pool.query(`
      SELECT Status AS status, COUNT(*) AS count
      FROM Food_donation
      GROUP BY Status
    `);

    // 3. Delivery status distribution
    const [deliveriesByStatus] = await pool.query(`
      SELECT Status AS status, COUNT(*) AS count
      FROM Delivery
      GROUP BY Status
    `);

    // 4. Food category distribution (JOIN Food_donation and Food_item)
    const [categoryDistribution] = await pool.query(`
      SELECT fi.Category AS category, COUNT(fd.Donation_id) AS donationsCount, SUM(fd.Quantity) AS totalQuantity
      FROM Food_donation fd
      JOIN Food_item fi ON fd.Item_id = fi.Item_id
      GROUP BY fi.Category
      ORDER BY donationsCount DESC
    `);

    // 5. Monthly donation trends (last 6 months)
    const [monthlyTrends] = await pool.query(`
      SELECT 
        DATE_FORMAT(Donation_DateTime, '%Y-%m') AS month,
        COUNT(*) AS totalDonations,
        SUM(Quantity) AS totalQuantity
      FROM Food_donation
      GROUP BY DATE_FORMAT(Donation_DateTime, '%Y-%m')
      ORDER BY month ASC
      LIMIT 12
    `);

    // 6. Recent donations with donor and item
    const [recentDonations] = await pool.query(`
      SELECT 
        fd.Donation_id,
        fd.Quantity,
        fd.Status,
        fd.Donation_DateTime,
        d.Name AS donorName,
        fi.Item_name AS itemName,
        fi.Unit AS unit,
        fi.Category AS category
      FROM Food_donation fd
      JOIN Donor d ON fd.Donor_id = d.Donor_id
      JOIN Food_item fi ON fd.Item_id = fi.Item_id
      ORDER BY fd.Donation_DateTime DESC
      LIMIT 5
    `);

    // 7. Recent deliveries
    const [recentDeliveries] = await pool.query(`
      SELECT 
        del.Delivery_id,
        del.Quantity,
        del.Status,
        del.Pickup_DateTime,
        del.Delivery_DateTime,
        fi.Item_name AS itemName,
        fi.Unit AS unit,
        dp.Name AS partnerName,
        ngo.Name AS ngoName,
        COALESCE(b.Name, su.Unit_name) AS destination,
        CASE WHEN del.Beneficiary_id IS NOT NULL THEN 'Beneficiary' ELSE 'Storage Unit' END AS destinationType
      FROM Delivery del
      JOIN Food_donation fd ON del.Donation_id = fd.Donation_id
      JOIN Food_item fi ON fd.Item_id = fi.Item_id
      JOIN Delivery_partner dp ON del.Delivery_partner_id = dp.Partner_id
      JOIN NGO ngo ON del.NGO_id = ngo.NGO_id
      LEFT JOIN Beneficiary b ON del.Beneficiary_id = b.Beneficiary_id
      LEFT JOIN Storage_Unit su ON del.Unit_id = su.Unit_id
      ORDER BY del.Delivery_id DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        summary: counts[0],
        donationsByStatus,
        deliveriesByStatus,
        categoryDistribution,
        monthlyTrends,
        recentDonations,
        recentDeliveries
      }
    });
  } catch (error) {
    next(error);
  }
};
