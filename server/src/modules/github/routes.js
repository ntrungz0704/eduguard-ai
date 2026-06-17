const express = require('express');
const router = express.Router();
const githubService = require('./githubService');
const { jwtMiddleware } = require('../auth/middleware');

router.use(jwtMiddleware);

router.post('/verify', async (req, res) => {
  try {
    const { githubUrl } = req.body;
    if (!githubUrl) {
      return res.status(400).json({ error: 'GitHub URL is required' });
    }
    
    const result = await githubService.verifyRepository(githubUrl);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
