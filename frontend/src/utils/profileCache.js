// Profile Cache Utility using localStorage

const PROFILE_CACHE_KEY = 'movieguess_profile';

export const profileCache = {
  // Get cached profile data
  get: () => {
    try {
      const cached = localStorage.getItem(PROFILE_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error reading profile cache:', error);
      return null;
    }
  },

  // Set profile data in cache
  set: (profileData) => {
    try {
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profileData));
    } catch (error) {
      console.error('Error setting profile cache:', error);
    }
  },

  // Clear profile cache
  clear: () => {
    try {
      localStorage.removeItem(PROFILE_CACHE_KEY);
    } catch (error) {
      console.error('Error clearing profile cache:', error);
    }
  },

  // Update specific field
  update: (field, value) => {
    try {
      const cached = profileCache.get() || {};
      cached[field] = value;
      profileCache.set(cached);
    } catch (error) {
      console.error('Error updating profile cache:', error);
    }
  }
};
