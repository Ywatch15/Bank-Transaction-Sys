/**
 * Send a standardized success response
 * @param {Object} res - Express response object
 * @param {*} data - Data to return
 * @param {number} status - HTTP status code (default 200)
 * @returns {void}
 */
function successResponse(res, data, status = 200) {
  return res.status(status).json({
    success: true,
    data
  });
}

/**
 * Send a standardized error response
 * @param {Object} res - Express response object
 * @param {number} status - HTTP status code
 * @param {string} code - Machine-readable error code (e.g., "validation_error")
 * @param {string} message - Human-readable error message
 * @param {Object} details - Optional additional error details
 * @returns {void}
 */
function errorResponse(res, status, code, message, details = null) {
  const body = {
    success: false,
    error: {
      code,
      message
    }
  };
  
  if (details) {
    body.error.details = details;
  }
  
  return res.status(status).json(body);
}

module.exports = {
  successResponse,
  errorResponse
};
