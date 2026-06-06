const axios = require('axios');

exports.verifyRepository = async (githubUrl) => {
  try {
    // Parse URL (e.g. https://github.com/username/repo)
    const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      return { success: false, error: 'Invalid GitHub URL format.' };
    }
    
    const owner = match[1];
    const repo = match[2].replace('.git', '');
    
    // Call GitHub API to get languages
    const languagesRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}/languages`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        // 'Authorization': `token ${process.env.GITHUB_TOKEN}` // Optional: Add if hitting rate limits
      }
    });
    
    const languages = Object.keys(languagesRes.data);
    
    // Calculate points based on languages
    let points = 0;
    const techDetected = [];
    
    languages.forEach(lang => {
      if (['JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'Go', 'Rust', 'C++'].includes(lang)) {
        points += 10;
        techDetected.push(lang);
      } else if (['HTML', 'CSS', 'SCSS'].includes(lang)) {
        points += 5;
        techDetected.push(lang);
      } else {
        points += 2;
        techDetected.push(lang);
      }
    });
    
    // Bonus for having multiple languages indicating a full-stack or complex app
    if (languages.length >= 3) {
      points += 5;
    }
    
    return {
      success: true,
      data: {
        owner,
        repo,
        languages: techDetected,
        pointsAwarded: points,
        verifiedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error verifying GitHub repo:', error.response?.data || error.message);
    return { success: false, error: 'Failed to verify repository. Make sure it is public.' };
  }
};
