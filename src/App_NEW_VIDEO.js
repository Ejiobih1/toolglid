// This file contains ONLY the new video player implementation
// Copy the relevant sections to replace in App.js

// ===== SECTION 1: Remove these state variables from App.js =====
// DELETE THESE LINES (around line 53-58):
//   const [youtubePlayer, setYoutubePlayer] = useState(null);
//   const [videoWatchProgress, setVideoWatchProgress] = useState(0);
//   const [videoStartTime, setVideoStartTime] = useState(0);
//   const [lastKnownTime, setLastKnownTime] = useState(0);
//   const [hasSkipped, setHasSkipped] = useState(false);
//   const playerRef = useRef(null);

// DELETE THESE LINES (around line 60-68):
//   const progressRef = useRef(0);
//   const skippedRef = useRef(false);
//   useEffect(() => {
//     progressRef.current = videoWatchProgress;
//     skippedRef.current = hasSkipped;
//   }, [videoWatchProgress, hasSkipped]);


// ===== SECTION 2: ADD these new state variables (add after line 50) =====
const [videoWatched, setVideoWatched] = useState(false);


// ===== SECTION 3: REPLACE handleVideoSelect function (around line 248-254) =====
const handleVideoSelect = (video) => {
  setSelectedVideo(video);
  setVideoWatched(false);
};


// ===== SECTION 4: REPLACE the entire useEffect for YouTube Player (lines 256-414) =====
// DELETE ALL THE OLD PLAYER CODE AND REPLACE WITH THIS:

// No useEffect needed for the player anymore!
// The iframe will load automatically


// ===== SECTION 5: REPLACE handleVideoWatched function (around line 307-320) =====
const handleVideoWatched = () => {
  if (!selectedVideo) return;

  if (!videoWatched) {
    alert('Please watch the video first! The "I\'ve Watched" button will enable after you watch for a bit.');
    return;
  }

  const accessHours = selectedVideo.accessHours;
  const expiresAt = Date.now() + (accessHours * 60 * 60 * 1000);

  localStorage.setItem('pdf_access', JSON.stringify({
    expiresAt,
    videoId: selectedVideo.id
  }));

  setIsUnlocked(true);
  setTimeRemaining(accessHours * 60 * 60);
  setShowVideoModal(false);
  setSelectedVideo(null);
};


// ===== SECTION 6: REPLACE the video modal JSX (around lines 862-917) =====
// FIND THIS CODE in the JSX section:
//   <div>
//     <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
//       <div id="youtube-player" ref={playerRef} style={{ width: '100%', height: '100%' }}></div>
//     </div>

// REPLACE WITH THIS:

<div>
  <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
    <iframe
      width="100%"
      height="100%"
      src={`https://www.youtube.com/embed/${selectedVideo.id}?rel=0&modestbranding=1&autoplay=1`}
      title={selectedVideo.title}
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      onLoad={() => {
        // Enable the button after iframe loads
        setTimeout(() => {
          setVideoWatched(true);
        }, selectedVideo.duration * 60 * 1000); // Wait for video duration
      }}
    ></iframe>
  </div>

  <p className={`text-sm text-center mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
    Watch the video to unlock {selectedVideo.accessHours} hour{selectedVideo.accessHours > 1 ? 's' : ''} of access
  </p>

  <button
    onClick={handleVideoWatched}
    disabled={!videoWatched}
    className={`w-full py-4 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 ${
      videoWatched
        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg cursor-pointer'
        : 'bg-gray-400 text-gray-200 cursor-not-allowed'
    }`}
  >
    <CheckCircle className="w-5 h-5" />
    <span>{videoWatched ? 'I\'ve Watched the Video - Unlock Access' : 'Watch the video first...'}</span>
  </button>

  <div className={`mt-4 p-4 rounded-lg ${
    darkMode ? 'bg-purple-900/20 border border-purple-500/30' : 'bg-purple-50 border border-purple-200'
  }`}>
    <ul className={`text-sm space-y-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
      <li>✓ Video will play automatically</li>
      <li>✓ Button unlocks after {selectedVideo.duration} minutes</li>
      <li>✓ No skipping detection (honor system)</li>
    </ul>
  </div>
</div>


// ===== SECTION 7: DELETE the progress tracking useEffect (lines 416-435) =====
// DELETE THIS ENTIRE BLOCK:
//   // Track video progress and detect skipping
//   useEffect(() => {
//     if (!youtubePlayer || !selectedVideo) return;
//     ...
//   }, [youtubePlayer, lastKnownTime, selectedVideo]);


// ===== IMPORTANT NOTES =====
// This new implementation is MUCH simpler:
// 1. Uses a regular YouTube iframe (no complex API)
// 2. No progress tracking or skip detection
// 3. Button unlocks after video duration time passes
// 4. Honor system - assumes users watch the video
// 5. Much more reliable - no API loading issues
