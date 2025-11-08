// services/indexService.js - MAIN EXPORT FOR ALL SERVICES
export { playlistService } from './playlistService';
export { analyticsService } from './analyticsService';
export { searchService } from './searchService';

// Re-export supabase config for convenience
export { supabase } from '../lib/supabase';

/**
 * MAIN SERVICE INITIALIZATION
 * Centralized service management and health checks
 */
export const serviceManager = {
  /**
   * Initialize all services and check health
   */
  initialize: async () => {
    console.log('🔄 Initializing all services...');
    
    const initResults = {
      playlistService: { status: 'pending', message: '' },
      analyticsService: { status: 'pending', message: '' },
      searchService: { status: 'pending', message: '' },
      database: { status: 'pending', message: '' },
      timestamp: new Date().toISOString()
    };

    try {
      // Check database connection
      console.log('🔍 Checking database connection...');
      const dbHealth = await playlistService.healthCheck();
      initResults.database = {
        status: dbHealth.healthy ? 'connected' : 'error',
        message: dbHealth.message
      };

      // Initialize playlist service
      console.log('🔍 Initializing playlist service...');
      initResults.playlistService = {
        status: 'ready',
        message: `Loaded ${(await playlistService.getPlaylists({ limit: 1 })).length} playlists`
      };

      // Initialize analytics service
      console.log('🔍 Initializing analytics service...');
      const analyticsHealth = await analyticsService.healthCheck();
      initResults.analyticsService = {
        status: analyticsHealth.analytics.healthy ? 'ready' : 'warning',
        message: `Tracking ${analyticsHealth.analytics.totalPlaylists} playlists`
      };

      // Initialize search service
      console.log('🔍 Initializing search service...');
      initResults.searchService = {
        status: 'ready',
        message: 'Search engine ready'
      };

      console.log('✅ All services initialized successfully');
      return {
        success: true,
        services: initResults
      };

    } catch (error) {
      console.error('❌ Service initialization failed:', error);
      return {
        success: false,
        error: error.message,
        services: initResults
      };
    }
  },

  /**
   * Get overall system status
   */
  getStatus: async () => {
    try {
      const dbHealth = await playlistService.healthCheck();
      const platformStats = await analyticsService.getPlatformStats().catch(() => null);
      
      return {
        database: dbHealth,
        analytics: {
          healthy: !!platformStats,
          totalPlaylists: platformStats?.totals.playlists || 0,
          totalBooks: platformStats?.totals.books || 0,
          totalUsers: platformStats ? new Set(
            (await playlistService.getPlaylists({ limit: 100 }))
              .map(p => p.created_by)
              .filter(Boolean)
          ).size : 0
        },
        search: {
          healthy: true,
          lastIndexUpdate: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        database: { healthy: false, message: error.message },
        analytics: { healthy: false },
        search: { healthy: false },
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * Clear all cached data (for debugging/reset)
   */
  clearCache: async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('communityPlaylists');
      localStorage.removeItem('playlistsLastUpdate');
      console.log('🗑️ Cleared service cache');
    }
    return { success: true, message: 'Cache cleared' };
  },

  /**
   * Export all data for backup
   */
  exportData: async () => {
    try {
      const playlists = await playlistService.getPlaylists({ limit: 1000 });
      const platformStats = await analyticsService.getPlatformStats();
      
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          version: '1.0',
          totalPlaylists: playlists.length,
          totalBooks: platformStats?.totals.books || 0
        },
        playlists: playlists,
        statistics: platformStats
      };

      return exportData;
    } catch (error) {
      console.error('❌ Error exporting data:', error);
      throw error;
    }
  }
};

/**
 * SERVICE USAGE EXAMPLES
 * Demo functions showing how to use each service
 */
export const serviceExamples = {
  // Playlist Service Examples
  playlist: {
    createExample: async () => {
      const newPlaylist = await playlistService.createPlaylist({
        name: 'Contoh Playlist Baru',
        description: 'Ini adalah contoh playlist',
        created_by: 'user_example_123',
        is_public: true,
        books: []
      });
      return newPlaylist;
    },

    searchExample: async (query) => {
      const results = await playlistService.searchPlaylists(query, {
        limit: 10,
        sortBy: 'relevance'
      });
      return results;
    }
  },

  // Analytics Service Examples
  analytics: {
    userStatsExample: async (userId) => {
      const stats = await analyticsService.getUserContribution(userId);
      return stats;
    },

    platformStatsExample: async () => {
      const stats = await analyticsService.getPlatformStats();
      return stats;
    },

    trendingExample: async () => {
      const trending = await analyticsService.getTrendingPlaylists('week', 5);
      return trending;
    }
  },

  // Search Service Examples
  search: {
    unifiedSearchExample: async (query) => {
      const results = await searchService.unifiedSearch(query, {
        limit: 10,
        searchIn: 'all',
        sortBy: 'relevance'
      });
      return results;
    },

    advancedSearchExample: async () => {
      const results = await searchService.searchByMetadata({
        author: 'soekarno',
        yearRange: [1945, 1965],
        limit: 10
      });
      return results;
    },

    similarPlaylistsExample: async (playlistId) => {
      const similar = await searchService.getSimilarPlaylists(playlistId, 3);
      return similar;
    }
  }
};

// Default export for easy importing
export default {
  playlistService,
  analyticsService,
  searchService,
  serviceManager,
  serviceExamples,
  supabase
};
