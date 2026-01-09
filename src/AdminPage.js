import React, { useState, useEffect } from 'react';
import { Lock, Plus, Edit2, Trash2, Save, X, Youtube, Clock, Unlock, RefreshCw } from 'lucide-react';
import { supabase } from './lib/supabase';

export default function AdminPage({ darkMode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [videos, setVideos] = useState([]);
  const [editingVideo, setEditingVideo] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Admin password from environment variable
  const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD || 'SET_ADMIN_PASSWORD_IN_ENV';

  // Form state for adding/editing videos
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    duration: '',
    accessHours: '',
  });

  // Load videos from Supabase on mount
  useEffect(() => {
    // Check if already authenticated
    const authStatus = sessionStorage.getItem('admin_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      loadVideos();
    }
  }, []);

  // Fetch videos from Supabase
  const loadVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to match component format
      const formattedVideos = data.map(video => ({
        id: video.id,
        title: video.title,
        duration: video.duration,
        accessHours: video.access_hours,
      }));

      setVideos(formattedVideos);
    } catch (err) {
      console.error('Error loading videos:', err);
      setError('Failed to load videos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
      setPassword('');
      loadVideos();
    } else {
      alert('Incorrect password!');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
    setVideos([]);
  };

  const handleAddVideo = () => {
    setShowAddForm(true);
    setEditingVideo(null);
    setFormData({
      id: '',
      title: '',
      duration: '',
      accessHours: '',
    });
    setError(null);
  };

  const handleEditVideo = (video) => {
    setEditingVideo(video);
    setShowAddForm(true);
    setFormData(video);
    setError(null);
  };

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this video?')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      // Remove from local state
      setVideos(videos.filter(v => v.id !== videoId));
      alert('Video deleted successfully!');
    } catch (err) {
      console.error('Error deleting video:', err);
      setError('Failed to delete video: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Extract video ID from any YouTube URL format
  const extractVideoId = (input) => {
    if (!input) return '';

    // If it's already just an ID (11 characters, no special chars except dash/underscore)
    if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) {
      return input.trim();
    }

    // Extract from various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([a-zA-Z0-9_-]{11}).*/
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
      if (match && match[7]) {
        return match[7];
      }
    }

    // If no pattern matches, return the input as-is
    return input.trim();
  };

  const handleSaveVideo = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.id || !formData.title || !formData.duration || !formData.accessHours) {
      alert('Please fill in all fields!');
      return;
    }

    // Extract video ID from URL if needed
    const videoId = extractVideoId(formData.id);

    // Validate the extracted ID
    if (!videoId || videoId.length !== 11) {
      alert('Invalid YouTube video ID or URL!\n\nPlease enter either:\n- Video ID: dQw4w9WgXcQ\n- Full URL: https://www.youtube.com/watch?v=dQw4w9WgXcQ\n- Short URL: https://youtu.be/dQw4w9WgXcQ');
      return;
    }

    const videoData = {
      id: videoId,
      title: formData.title,
      duration: parseInt(formData.duration),
      access_hours: parseInt(formData.accessHours),
    };

    setLoading(true);
    setError(null);

    try {
      if (editingVideo) {
        // Update existing video
        const { error } = await supabase
          .from('videos')
          .update({
            title: videoData.title,
            duration: videoData.duration,
            access_hours: videoData.access_hours,
          })
          .eq('id', editingVideo.id);

        if (error) throw error;

        // Update local state
        setVideos(videos.map(v =>
          v.id === editingVideo.id
            ? { ...v, title: videoData.title, duration: videoData.duration, accessHours: videoData.access_hours }
            : v
        ));
        alert('Video updated successfully!');
      } else {
        // Add new video
        const { error } = await supabase
          .from('videos')
          .insert([videoData]);

        if (error) {
          if (error.code === '23505') { // Unique violation
            throw new Error('Video ID already exists!');
          }
          throw error;
        }

        // Reload videos to get the new one with timestamps
        await loadVideos();
        alert('Video added successfully!');
      }

      setShowAddForm(false);
      setEditingVideo(null);
      setFormData({ id: '', title: '', duration: '', accessHours: '' });
    } catch (err) {
      console.error('Error saving video:', err);
      setError('Failed to save video: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingVideo(null);
    setFormData({ id: '', title: '', duration: '', accessHours: '' });
    setError(null);
  };

  if (!isAuthenticated) {
    // Login Screen
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-[#1E1E2E]' : 'bg-gray-50'}`}>
        <div className={`max-w-md w-full mx-4 p-8 rounded-2xl shadow-2xl ${darkMode ? 'bg-[#2A2A3E]' : 'bg-white'}`}>
          <div className="text-center mb-6">
            <Lock className="w-16 h-16 mx-auto mb-4 text-purple-500" />
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Admin Login
            </h1>
            <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Enter password to manage videos
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className={`w-full px-4 py-3 rounded-lg border-2 ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:border-purple-500 focus:outline-none`}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              <Unlock className="w-5 h-5" />
              <span>Login</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#1E1E2E]' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b ${
        darkMode ? 'bg-[#2A2A3E]/90 border-purple-500/20' : 'bg-white/90 border-purple-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Admin Dashboard
              </h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Manage YouTube videos - Stored in Supabase Database
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={loadVideos}
                disabled={loading}
                className={`p-2 rounded-lg ${
                  darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } disabled:opacity-50`}
                title="Refresh videos"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleLogout}
                className={`px-4 py-2 rounded-lg font-medium ${
                  darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Add Video Button */}
        <div className="mb-6">
          <button
            onClick={handleAddVideo}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            <span>Add New Video</span>
          </button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className={`mb-6 p-6 rounded-2xl shadow-lg ${darkMode ? 'bg-[#2A2A3E]' : 'bg-white'}`}>
            <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {editingVideo ? 'Edit Video' : 'Add New Video'}
            </h2>

            <form onSubmit={handleSaveVideo} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  YouTube Video ID or URL
                </label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  placeholder="e.g., dQw4w9WgXcQ OR https://youtu.be/dQw4w9WgXcQ"
                  className={`w-full px-4 py-2 rounded-lg border-2 ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:border-purple-500 focus:outline-none`}
                  required
                  disabled={editingVideo !== null}
                />
                <p className={`mt-1 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  ✅ Paste full URL: <strong>https://youtu.be/VIDEO_ID</strong> OR <strong>https://www.youtube.com/watch?v=VIDEO_ID</strong>
                  <br />
                  ✅ Or just the ID: <strong>VIDEO_ID</strong>
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Video Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Introduction to PDF Tools"
                  className={`w-full px-4 py-2 rounded-lg border-2 ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:border-purple-500 focus:outline-none`}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Video Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 5"
                    min="1"
                    className={`w-full px-4 py-2 rounded-lg border-2 ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:border-purple-500 focus:outline-none`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Access Hours Granted
                  </label>
                  <input
                    type="number"
                    value={formData.accessHours}
                    onChange={(e) => setFormData({ ...formData, accessHours: e.target.value })}
                    placeholder="e.g., 3"
                    min="1"
                    className={`w-full px-4 py-2 rounded-lg border-2 ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:border-purple-500 focus:outline-none`}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  disabled={loading}
                  className={`px-6 py-2 rounded-lg font-medium ${
                    darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } disabled:opacity-50`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  <span>{loading ? 'Saving...' : editingVideo ? 'Update Video' : 'Add Video'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Videos List */}
        <div className={`rounded-2xl shadow-lg overflow-hidden ${darkMode ? 'bg-[#2A2A3E]' : 'bg-white'}`}>
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Videos ({videos.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading && videos.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <RefreshCw className={`w-16 h-16 mx-auto mb-4 animate-spin ${darkMode ? 'text-purple-500' : 'text-purple-600'}`} />
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Loading videos from database...
                </p>
              </div>
            ) : videos.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Youtube className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  No videos added yet. Click "Add New Video" to get started.
                </p>
              </div>
            ) : (
              videos.map((video) => (
                <div
                  key={video.id}
                  className={`px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Youtube className="w-5 h-5 text-red-500" />
                        <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {video.title}
                        </h3>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          ID: <code className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} px-2 py-1 rounded`}>{video.id}</code>
                        </span>
                        <span className={`flex items-center space-x-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <Clock className="w-4 h-4" />
                          <span>{video.duration} min</span>
                        </span>
                        <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Grants: {video.accessHours}h access
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditVideo(video)}
                        disabled={loading}
                        className={`p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 transition-colors disabled:opacity-50`}
                        title="Edit"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteVideo(video.id)}
                        disabled={loading}
                        className={`p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors disabled:opacity-50`}
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className={`mt-6 p-6 rounded-2xl ${darkMode ? 'bg-[#2A2A3E]' : 'bg-blue-50'}`}>
          <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            💾 Database Storage Active
          </h3>
          <p className={`text-sm mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Videos are now stored in Supabase database. Changes sync across all devices automatically!
          </p>
          <h3 className={`font-semibold mb-2 mt-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            How to find YouTube Video ID:
          </h3>
          <ol className={`list-decimal list-inside space-y-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <li>Go to your YouTube video</li>
            <li>Copy the URL (e.g., https://www.youtube.com/watch?v=<strong>dQw4w9WgXcQ</strong>)</li>
            <li>The Video ID is the part after "v=" (in this case: <strong>dQw4w9WgXcQ</strong>)</li>
            <li>Paste the full URL or just the ID - both work!</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
