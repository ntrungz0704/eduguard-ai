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
}

module.exports = new GraphController();
