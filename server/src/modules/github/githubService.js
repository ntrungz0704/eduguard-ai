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
    
    // Config API Headers
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
    };
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    // Call GitHub API to get languages and commits in parallel
    const [languagesRes, commitsRes] = await Promise.all([
      axios.get(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers }),
      axios.get(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=100`, { headers }).catch(() => ({ data: [] }))
    ]);
    
    const languages = Object.keys(languagesRes.data);
    const commits = commitsRes.data || [];
    const commitCount = commits.length;
    
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

    // NEW: Real GitHub Commit Analysis
    // 1 commit = 1 point, cap at 50
    const commitPoints = Math.min(commitCount, 50);
    points += commitPoints;

    return {
      success: true,
      data: {
        owner,
        repo,
        commitCount,
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
