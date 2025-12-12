// User Tracking Utility - Anonymous user identification and tracking
// No login required for free users, premium requires authentication

/**
 * Generate a browser fingerprint for anonymous user identification
 * This creates a consistent ID based on browser characteristics
 */
export const generateFingerprint = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('fingerprint', 2, 2);

  const fingerprint = {
    screen: `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
    userAgent: navigator.userAgent,
    canvas: canvas.toDataURL(),
    plugins: Array.from(navigator.plugins || []).map(p => p.name).join(','),
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: navigator.deviceMemory,
  };

  // Create hash from fingerprint
  const fingerprintString = JSON.stringify(fingerprint);
  let hash = 0;
  for (let i = 0; i < fingerprintString.length; i++) {
    const char = fingerprintString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return `fp_${Math.abs(hash).toString(36)}`;
};

/**
 * Get or create unique user ID
 */
export const getUserId = () => {
  let userId = localStorage.getItem('unique_user_id');

  if (!userId) {
    userId = generateFingerprint();
    localStorage.setItem('unique_user_id', userId);
    localStorage.setItem('user_created_at', Date.now().toString());
  }

  return userId;
};

/**
 * Check if user has confirmed subscription
 */
export const hasUserSubscribed = () => {
  const userId = getUserId();
  const subscribed = localStorage.getItem(`${userId}_subscribed`);
  return subscribed === 'true';
};

/**
 * Mark user as subscribed
 */
export const setUserSubscribed = () => {
  const userId = getUserId();
  localStorage.setItem(`${userId}_subscribed`, 'true');
  localStorage.setItem(`${userId}_subscription_date`, Date.now().toString());
  localStorage.setItem(`${userId}_subscription_count`, '1');
};

/**
 * Check if user should re-confirm subscription (after 30 days)
 */
export const shouldReconfirmSubscription = () => {
  const userId = getUserId();
  const subscriptionDate = localStorage.getItem(`${userId}_subscription_date`);

  if (!subscriptionDate) return true;

  const daysSince = (Date.now() - parseInt(subscriptionDate)) / (1000 * 60 * 60 * 24);
  return daysSince > 30; // Re-confirm after 30 days
};

/**
 * Track video interaction (like, comment)
 */
export const trackVideoInteraction = (videoId, action, data = {}) => {
  const userId = getUserId();
  const storageKey = `${userId}_videos`;

  // Get existing video data
  const videosData = JSON.parse(localStorage.getItem(storageKey) || '{}');

  // Update video data
  if (!videosData[videoId]) {
    videosData[videoId] = {};
  }

  videosData[videoId][action] = {
    ...data,
    timestamp: Date.now()
  };

  // Save back to localStorage
  localStorage.setItem(storageKey, JSON.stringify(videosData));
};

/**
 * Check if user has liked a specific video
 */
export const hasLikedVideo = (videoId) => {
  const userId = getUserId();
  const storageKey = `${userId}_videos`;
  const videosData = JSON.parse(localStorage.getItem(storageKey) || '{}');

  return videosData[videoId]?.liked !== undefined;
};

/**
 * Check if user has commented on a specific video
 */
export const hasCommentedOnVideo = (videoId) => {
  const userId = getUserId();
  const storageKey = `${userId}_videos`;
  const videosData = JSON.parse(localStorage.getItem(storageKey) || '{}');

  return videosData[videoId]?.commented !== undefined;
};

/**
 * Mark video as liked
 */
export const setVideoLiked = (videoId) => {
  trackVideoInteraction(videoId, 'liked', { confirmed: true });
};

/**
 * Save user's comment for a video
 */
export const saveVideoComment = (videoId, commentText) => {
  trackVideoInteraction(videoId, 'commented', {
    text: commentText,
    confirmed: true
  });
};

/**
 * Get user statistics
 */
export const getUserStats = () => {
  const userId = getUserId();
  const subscribed = hasUserSubscribed();
  const subscriptionDate = localStorage.getItem(`${userId}_subscription_date`);
  const userCreatedAt = localStorage.getItem('user_created_at');
  const videosData = JSON.parse(localStorage.getItem(`${userId}_videos`) || '{}');

  return {
    userId,
    subscribed,
    subscriptionDate: subscriptionDate ? new Date(parseInt(subscriptionDate)) : null,
    userCreatedAt: userCreatedAt ? new Date(parseInt(userCreatedAt)) : null,
    videosWatched: Object.keys(videosData).length,
    videosLiked: Object.values(videosData).filter(v => v.liked).length,
    videosCommented: Object.values(videosData).filter(v => v.commented).length,
    lastVisit: Date.now()
  };
};

/**
 * Update last visit timestamp
 */
export const updateLastVisit = () => {
  const userId = getUserId();
  localStorage.setItem(`${userId}_last_visit`, Date.now().toString());
};

/**
 * Check if user is returning (visited before)
 */
export const isReturningUser = () => {
  const userCreatedAt = localStorage.getItem('user_created_at');
  if (!userCreatedAt) return false;

  const hoursSinceCreation = (Date.now() - parseInt(userCreatedAt)) / (1000 * 60 * 60);
  return hoursSinceCreation > 1; // Consider returning if created more than 1 hour ago
};

/**
 * Get welcome message for user
 */
export const getWelcomeMessage = () => {
  if (isReturningUser()) {
    const stats = getUserStats();
    if (stats.subscribed) {
      return `Welcome back! 👋 You've watched ${stats.videosWatched} video${stats.videosWatched !== 1 ? 's' : ''}.`;
    }
    return "Welcome back! 👋";
  }
  return "Welcome! 🎉";
};

/**
 * Reset user data (for testing)
 */
export const resetUserData = () => {
  const userId = getUserId();
  const keysToRemove = [
    'unique_user_id',
    'user_created_at',
    `${userId}_subscribed`,
    `${userId}_subscription_date`,
    `${userId}_subscription_count`,
    `${userId}_videos`,
    `${userId}_last_visit`
  ];

  keysToRemove.forEach(key => localStorage.removeItem(key));
};
