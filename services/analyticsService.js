// services/analyticsService.js - PLAYLIST ANALYTICS & REPORTING
import { supabase } from '../lib/supabase';
import { playlistService } from './playlistService';

export const analyticsService = {
  // ========================
  // PLAYLIST STATISTICS
  // ========================

  /**
   * Get comprehensive stats for a playlist
   */
  getPlaylistStats: async (playlistId) => {
    try {
      const playlist = await playlistService.getPlaylistById(playlistId);
      if (!playlist) {
        throw new Error('Playlist tidak ditemukan');
      }

      const stats = {
        basic: {
          id: playlist.id,
          name: playlist.name,
          bookCount: playlist.books?.length || 0,
          createdDate: playlist.created_at,
          lastUpdated: playlist.updated_at
        },
        engagement: {
          views: playlist.view_count || 0,
          likes: playlist.like_count || 0,
          reports: playlist.report_count || 0
        },
        books: {
          total: playlist.books?.length || 0,
          byYear: analyticsService._analyzeBooksByYear(playlist.books),
          byLanguage: analyticsService._analyzeBooksByLanguage(playlist.books),
          recentAdditions: playlist.books
            ?.sort((a, b) => new Date(b.added_at) - new Date(a.added_at))
            .slice(0, 5) || []
        }
      };

      return stats;
    } catch (error) {
      console.error('❌ Error in getPlaylistStats:', error);
      throw error;
    }
  },

  /**
   * Get user contribution statistics
   */
  getUserContribution: async (userId) => {
    try {
      const userPlaylists = await playlistService.getUserPlaylists(userId);
      
      const stats = {
        userInfo: {
          userId: userId,
          firstPlaylistDate: userPlaylists.length > 0 
            ? new Date(Math.min(...userPlaylists.map(p => new Date(p.created_at))))
            : null
        },
        overview: {
          totalPlaylists: userPlaylists.length,
          totalBooks: userPlaylists.reduce((sum, playlist) => 
            sum + (playlist.books?.length || 0), 0
          ),
          totalLikes: userPlaylists.reduce((sum, playlist) => 
            sum + (playlist.like_count || 0), 0
          ),
          totalViews: userPlaylists.reduce((sum, playlist) => 
            sum + (playlist.view_count || 0), 0
          )
        },
        popularity: {
          mostLikedPlaylist: userPlaylists.length > 0 
            ? userPlaylists.reduce((max, playlist) => 
                (playlist.like_count || 0) > (max.like_count || 0) ? playlist : max
              )
            : null,
          mostViewedPlaylist: userPlaylists.length > 0
            ? userPlaylists.reduce((max, playlist) => 
                (playlist.view_count || 0) > (max.view_count || 0) ? playlist : max
              )
            : null
        },
        activity: {
          playlistsCreatedThisMonth: userPlaylists.filter(playlist => {
            const created = new Date(playlist.created_at);
            const now = new Date();
            return created.getMonth() === now.getMonth() && 
                   created.getFullYear() === now.getFullYear();
          }).length,
          lastActivity: userPlaylists.length > 0
            ? new Date(Math.max(...userPlaylists.map(p => new Date(p.updated_at))))
            : null
        }
      };

      return stats;
    } catch (error) {
      console.error('❌ Error in getUserContribution:', error);
      throw error;
    }
  },

  /**
   * Get platform-wide statistics
   */
  getPlatformStats: async () => {
    try {
      const allPlaylists = await playlistService.getPlaylists({ limit: 1000 });
      
      const stats = {
        totals: {
          playlists: allPlaylists.length,
          books: allPlaylists.reduce((sum, playlist) => 
            sum + (playlist.books?.length || 0), 0
          ),
          likes: allPlaylists.reduce((sum, playlist) => 
            sum + (playlist.like_count || 0), 0
          ),
          views: allPlaylists.reduce((sum, playlist) => 
            sum + (playlist.view_count || 0), 0
          )
        },
        growth: {
          playlistsCreatedToday: allPlaylists.filter(playlist => {
            const created = new Date(playlist.created_at);
            const today = new Date();
            return created.toDateString() === today.toDateString();
          }).length,
          playlistsCreatedThisWeek: allPlaylists.filter(playlist => {
            const created = new Date(playlist.created_at);
            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return created >= weekAgo;
          }).length
        },
        popular: {
          mostLikedPlaylists: allPlaylists
            .sort((a, b) => (b.like_count || 0) - (a.like_count || 0))
            .slice(0, 5),
          mostViewedPlaylists: allPlaylists
            .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
            .slice(0, 5),
          largestPlaylists: allPlaylists
            .sort((a, b) => (b.books?.length || 0) - (a.books?.length || 0))
            .slice(0, 5)
        },
        content: {
          totalBooks: allPlaylists.reduce((sum, playlist) => 
            sum + (playlist.books?.length || 0), 0
          ),
          uniqueBooks: analyticsService._countUniqueBooks(allPlaylists),
          averagePlaylistSize: allPlaylists.length > 0 
            ? (allPlaylists.reduce((sum, playlist) => 
                sum + (playlist.books?.length || 0), 0) / allPlaylists.length
              ).toFixed(1)
            : 0
        }
      };

      return stats;
    } catch (error) {
      console.error('❌ Error in getPlatformStats:', error);
      throw error;
    }
  },

  // ========================
  // TRENDING & DISCOVERY
  // ========================

  /**
   * Get trending playlists
   */
  getTrendingPlaylists: async (period = 'week', limit = 10) => {
    try {
      const allPlaylists = await playlistService.getPlaylists({ limit: 100 });
      
      // Simple trending algorithm based on engagement velocity
      const now = new Date();
      const playlistsWithScore = allPlaylists.map(playlist => {
        const created = new Date(playlist.created_at);
        const ageInDays = (now - created) / (1000 * 60 * 60 * 24);
        
        // Score based on likes per day and recent activity
        const likesPerDay = (playlist.like_count || 0) / Math.max(ageInDays, 1);
        const viewsPerDay = (playlist.view_count || 0) / Math.max(ageInDays, 1);
        const recencyBonus = playlist.updated_at ? 
          (now - new Date(playlist.updated_at)) / (1000 * 60 * 60 * 24) : 0;
        
        const score = (likesPerDay * 2) + viewsPerDay + (1 / (recencyBonus + 1));
        
        return {
          ...playlist,
          trendScore: score
        };
      });

      return playlistsWithScore
        .sort((a, b) => b.trendScore - a.trendScore)
        .slice(0, limit);
    } catch (error) {
      console.error('❌ Error in getTrendingPlaylists:', error);
      throw error;
    }
  },

  /**
   * Get recommended playlists based on user activity
   */
  getRecommendedPlaylists: async (userId, limit = 5) => {
    try {
      const userPlaylists = await playlistService.getUserPlaylists(userId);
      const allPlaylists = await playlistService.getPlaylists({ limit: 100 });
      
      if (userPlaylists.length === 0) {
        // If no user history, return popular playlists
        return allPlaylists
          .sort((a, b) => (b.like_count || 0) - (a.like_count || 0))
          .slice(0, limit);
      }

      // Simple recommendation based on similar books
      const userBooks = new Set();
      userPlaylists.forEach(playlist => {
        playlist.books?.forEach(book => {
          if (book.id) userBooks.add(book.id);
        });
      });

      const playlistsWithScore = allPlaylists
        .filter(playlist => !userPlaylists.some(up => up.id === playlist.id)) // Exclude user's own
        .map(playlist => {
          const commonBooks = playlist.books?.filter(book => 
            userBooks.has(book.id)
          ).length || 0;
          
          const score = commonBooks + (playlist.like_count || 0) * 0.1;
          
          return {
            ...playlist,
            recommendationScore: score,
            commonBooks: commonBooks
          };
        });

      return playlistsWithScore
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, limit);
    } catch (error) {
      console.error('❌ Error in getRecommendedPlaylists:', error);
      throw error;
    }
  },

  // ========================
  // REPORTING & INSIGHTS
  // ========================

  /**
   * Generate activity report
   */
  generateActivityReport: async (options = {}) => {
    try {
      const { period = 'month', userId = null } = options;
      const allPlaylists = await playlistService.getPlaylists({ limit: 1000 });
      
      const now = new Date();
      let startDate;
      
      switch (period) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const filteredPlaylists = allPlaylists.filter(playlist => {
        const created = new Date(playlist.created_at);
        return created >= startDate && (!userId || playlist.created_by === userId);
      });

      const report = {
        period: period,
        dateRange: {
          start: startDate,
          end: now
        },
        summary: {
          playlistsCreated: filteredPlaylists.length,
          totalLikes: filteredPlaylists.reduce((sum, p) => sum + (p.like_count || 0), 0),
          totalViews: filteredPlaylists.reduce((sum, p) => sum + (p.view_count || 0), 0),
          booksAdded: filteredPlaylists.reduce((sum, p) => sum + (p.books?.length || 0), 0)
        },
        topPerformers: {
          mostLiked: filteredPlaylists
            .sort((a, b) => (b.like_count || 0) - (a.like_count || 0))
            .slice(0, 3),
          mostActiveUsers: analyticsService._getMostActiveUsers(filteredPlaylists)
        },
        trends: {
          dailyActivity: analyticsService._calculateDailyActivity(filteredPlaylists, startDate, now),
          popularCategories: analyticsService._analyzePlaylistCategories(filteredPlaylists)
        }
      };

      return report;
    } catch (error) {
      console.error('❌ Error in generateActivityReport:', error);
      throw error;
    }
  },

  // ========================
  // HELPER FUNCTIONS
  // ========================

  /**
   * Analyze books by publication year
   */
  _analyzeBooksByYear: (books) => {
    if (!books || books.length === 0) return {};
    
    const yearCounts = {};
    books.forEach(book => {
      if (book.tahun_terbit) {
        const yearMatch = book.tahun_terbit.match(/\d{4}/);
        if (yearMatch) {
          const year = yearMatch[0];
          yearCounts[year] = (yearCounts[year] || 0) + 1;
        }
      }
    });
    
    return yearCounts;
  },

  /**
   * Analyze books by language (simple detection)
   */
  _analyzeBooksByLanguage: (books) => {
    if (!books || books.length === 0) return {};
    
    const languageCounts = {
      indonesia: 0,
      english: 0,
      dutch: 0,
      other: 0
    };
    
    books.forEach(book => {
      const title = book.judul?.toLowerCase() || '';
      const author = book.pengarang?.toLowerCase() || '';
      const text = title + ' ' + author;
      
      // Simple language detection
      if (text.includes('van ') || text.includes('de ') || text.includes('het ')) {
        languageCounts.dutch++;
      } else if (text.match(/\b(the|and|of|in|to)\b/)) {
        languageCounts.english++;
      } else if (text.match(/\b(dan|yang|di|dari|untuk)\b/)) {
        languageCounts.indonesia++;
      } else {
        languageCounts.other++;
      }
    });
    
    return languageCounts;
  },

  /**
   * Count unique books across all playlists
   */
  _countUniqueBooks: (playlists) => {
    const uniqueBookIds = new Set();
    playlists.forEach(playlist => {
      playlist.books?.forEach(book => {
        if (book.id) uniqueBookIds.add(book.id);
      });
    });
    return uniqueBookIds.size;
  },

  /**
   * Get most active users
   */
  _getMostActiveUsers: (playlists) => {
    const userActivity = {};
    playlists.forEach(playlist => {
      const user = playlist.created_by;
      if (!userActivity[user]) {
        userActivity[user] = {
          playlists: 0,
          totalLikes: 0,
          totalViews: 0
        };
      }
      userActivity[user].playlists++;
      userActivity[user].totalLikes += playlist.like_count || 0;
      userActivity[user].totalViews += playlist.view_count || 0;
    });
    
    return Object.entries(userActivity)
      .sort(([, a], [, b]) => b.playlists - a.playlists)
      .slice(0, 5)
      .map(([userId, stats]) => ({
        userId,
        ...stats
      }));
  },

  /**
   * Calculate daily activity
   */
  _calculateDailyActivity: (playlists, startDate, endDate) => {
    const dailyCounts = {};
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      dailyCounts[dateStr] = 0;
      current.setDate(current.getDate() + 1);
    }
    
    playlists.forEach(playlist => {
      const createdDate = new Date(playlist.created_at).toISOString().split('T')[0];
      if (dailyCounts[createdDate] !== undefined) {
        dailyCounts[createdDate]++;
      }
    });
    
    return dailyCounts;
  },

  /**
   * Analyze playlist categories from names
   */
  _analyzePlaylistCategories: (playlists) => {
    const categories = {};
    const commonCategories = [
      'sejarah', 'sastra', 'budaya', 'politik', 'ekonomi', 
      'agama', 'seni', 'filsafat', 'ilmu', 'teknologi'
    ];
    
    commonCategories.forEach(category => {
      categories[category] = 0;
    });
    
    playlists.forEach(playlist => {
      const name = playlist.name.toLowerCase();
      commonCategories.forEach(category => {
        if (name.includes(category)) {
          categories[category]++;
        }
      });
    });
    
    // Filter out categories with zero count
    return Object.fromEntries(
      Object.entries(categories).filter(([, count]) => count > 0)
    );
  },

  // ========================
  // HEALTH MONITORING
  // ========================

  /**
   * System health check
   */
  healthCheck: async () => {
    try {
      const dbHealth = await playlistService.healthCheck();
      const platformStats = await analyticsService.getPlatformStats().catch(() => null);
      
      return {
        database: dbHealth,
        analytics: {
          healthy: !!platformStats,
          totalPlaylists: platformStats?.totals.playlists || 0,
          totalUsers: platformStats ? new Set(
            (await playlistService.getPlaylists({ limit: 100 }))
              .map(p => p.created_by)
              .filter(Boolean)
          ).size : 0
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        database: { healthy: false, message: error.message },
        analytics: { healthy: false },
        timestamp: new Date().toISOString()
      };
    }
  }
};
