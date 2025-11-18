// pages/api/save-ai-score.js - NEW API ROUTE

import { playlistService } from '../../services/playlistService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { playlistId, bookId, analysis } = req.body;

    if (!playlistId || !bookId || !analysis) {
      return res.status(400).json({
        error: 'playlistId, bookId, and analysis are required'
      });
    }

    console.log('💾 Saving AI score:', { playlistId, bookId, score: analysis.matchScore });

    // Save to database
    await playlistService.saveAIMatchScore(playlistId, bookId, analysis);

    res.json({
      success: true,
      message: 'AI score saved successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Save AI score API Error:', error);
    res.status(500).json({
      error: 'Failed to save AI score',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
