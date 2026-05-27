const GraphService = require('./service');

class GraphController {
  async getDependencies(req, res) {
    try {
      const graphData = await GraphService.getDependencies();
      res.json(graphData);
    } catch (error) {
      console.error('Error fetching graph dependencies:', error);
      res.status(500).json({ error: 'Failed to fetch graph data' });
    }
  }

  async getRiskAnalysis(req, res) {
    try {
      const analysis = await GraphService.getRiskAnalysis();
      res.json(analysis);
    } catch (error) {
      console.error('Error fetching risk analysis:', error);
      res.status(500).json({ error: 'Failed to fetch risk analysis' });
    }
  }

  async getStudentRiskChain(req, res) {
    try {
      const { mssv } = req.params;
      if (!mssv) return res.status(400).json({ error: 'MSSV is required' });
      const analysis = await GraphService.getStudentRiskChain(mssv);
      res.json(analysis);
    } catch (error) {
      console.error('Error fetching student risk chain:', error);
      res.status(500).json({ error: 'Failed to fetch student risk chain', details: error.message });
    }
  }
}

module.exports = new GraphController();
