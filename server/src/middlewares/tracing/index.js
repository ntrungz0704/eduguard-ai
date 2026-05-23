const crypto = require('crypto');

module.exports = (req, res, next) => {
  // Use existing X-Request-ID if provided by load balancer/proxy, otherwise generate new
  const traceId = req.headers['x-request-id'] || crypto.randomUUID();
  
  req.traceId = traceId;
  res.setHeader('X-Request-ID', traceId);
  
  next();
};
