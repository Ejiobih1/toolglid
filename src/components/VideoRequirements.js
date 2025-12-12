import React, { useState } from 'react';
import { Check, ExternalLink, Bell } from 'lucide-react';

/**
 * VideoRequirements Component
 * Shows subscribe requirement before video playback
 * Redirects to YouTube channel page (not individual video)
 */
const VideoRequirements = ({
  darkMode,
  isReturningSubscriber,
  onComplete
}) => {
  const [subscribeChecked, setSubscribeChecked] = useState(isReturningSubscriber);

  const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@militarytechnology001';

  const handleOpenYouTubeChannel = () => {
    window.open(
      YOUTUBE_CHANNEL_URL,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleComplete = () => {
    if (subscribeChecked) {
      onComplete({
        subscribed: true
      });
    }
  };

  return (
    <div className={`p-6 rounded-xl ${darkMode ? 'bg-[#1E1E2E]' : 'bg-purple-50'}`}>
      <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Before you watch... 🎬
      </h3>

      <p className={`text-sm mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        Subscribe to our channel to unlock the video! This takes less than 10 seconds.
      </p>

      {/* Subscribe Requirement */}
      <div className={`mb-6 p-4 rounded-lg border-2 ${
        subscribeChecked
          ? darkMode ? 'border-green-500 bg-green-900/20' : 'border-green-400 bg-green-50'
          : darkMode ? 'border-purple-500/30 bg-purple-900/20' : 'border-purple-200 bg-white'
      }`}>
        <div className="flex items-start space-x-3">
          <Bell className={`w-6 h-6 mt-1 ${
            subscribeChecked ? 'text-green-500' : 'text-purple-500'
          }`} />
          <div className="flex-1">
            <h4 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Subscribe & Turn on Notifications 🔔
            </h4>
            <ol className={`text-sm space-y-1 mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <li>• Click the button below to open our YouTube channel</li>
              <li>• Click the red "Subscribe" button</li>
              <li>• Click the bell icon (🔔) next to subscribe</li>
              <li>• Select "All" to get notified of every video</li>
            </ol>
            <button
              onClick={handleOpenYouTubeChannel}
              className="mb-3 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center space-x-2 shadow-lg"
            >
              <ExternalLink className="w-5 h-5" />
              <span>Open YouTube Channel to Subscribe</span>
            </button>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={subscribeChecked}
                onChange={(e) => setSubscribeChecked(e.target.checked)}
                className="w-5 h-5 rounded border-2 border-purple-500 text-purple-600 focus:ring-purple-500"
              />
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                ✅ I have subscribed and turned on notifications
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Complete Button */}
      <button
        onClick={handleComplete}
        disabled={!subscribeChecked}
        className={`w-full py-3 rounded-lg font-semibold transition-all ${
          subscribeChecked
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg cursor-pointer'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {subscribeChecked ? (
          <span className="flex items-center justify-center space-x-2">
            <Check className="w-5 h-5" />
            <span>I've Subscribed - Start Video!</span>
          </span>
        ) : (
          'Subscribe to continue to video'
        )}
      </button>

      {/* Info */}
      <p className={`text-xs text-center mt-4 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
        🎁 Your support helps us create more content! Thank you! 💙
      </p>
    </div>
  );
};

export default VideoRequirements;
