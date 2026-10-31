// Error handling middleware with MySQL error code translations
function errorHandler(err, req, res, next) {
  console.error('[API Error]:', err);

  // MySQL specific errors
  if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
    return res.status(409).json({
      success: false,
      message: 'Cannot delete or modify this record because it is currently referenced by other database records (e.g. donations, requests, or deliveries).',
      code: err.code
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452) {
    return res.status(400).json({
      success: false,
      message: 'Referenced record not found. Please verify associated IDs (Donor, NGO, Item, etc.).',
      code: err.code
    });
  }

  if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry: A record with this unique value (such as Email, License No, Vehicle No, or Name) already exists.',
      code: err.code
    });
  }

  if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED' || err.errno === 3819) {
    return res.status(400).json({
      success: false,
      message: 'Database check constraint failed (e.g., quantity must be > 0, valid destination, or delivery time after pickup time).',
      code: err.code,
      detail: err.sqlMessage
    });
  }

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
}

module.exports = errorHandler;
