// pages/api/get-ai-score.js - NEW API ROUTE

import { playlistService } from '../../services/playlistService';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { playlistId, bookId } = req.query;

    if (!playlistId || !bookId) {
      return res.status(400).json({
        error: 'playlistId and bookId are required'
      });
    }

    console.log('📊 Getting AI score:', { playlistId, bookId });

    // Get from database
    const score = await playlistService.getAIMatchScore(playlistId, bookId);

    res.json({
      success: true,
      score: score,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Get AI score API Error:', error);
    res.status(500).json({
      error: 'Failed to get AI score',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
