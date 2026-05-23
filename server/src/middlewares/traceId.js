const { v4: uuidv4 } = require('uuid');

module.exports = (req, res, next) => {
  // Use existing X-Request-ID if provided by load balancer/proxy, otherwise generate new
  const traceId = req.headers['x-request-id'] || uuidv4();
  
  req.traceId = traceId;
  res.setHeader('X-Request-ID', traceId);
  
  next();
};
