# Testing Your YouTube Video

## Your Video
- **URL**: https://youtu.be/-6FYfcXFxn4
- **Video ID**: `-6FYfcXFxn4`

## Step-by-Step Test

### 1. Add Your Video to Admin

1. **Go to admin**: http://localhost:3000/#/admin
2. **Login**: `admin123`
3. **Delete placeholder videos** (click trash icon on each)
4. **Click "Add New Video"**
5. **Fill in**:
   - Video ID: `-6FYfcXFxn4`
   - Title: `My Test Video`
   - Duration: 5 (estimate in minutes)
   - Access Hours: 1
6. **Click "Add Video"**

### 2. Test the Video

1. **Go to main page**: http://localhost:3000
2. **Press F12** to open browser console (watch for errors/logs)
3. **Click any PDF tool**
4. **Select your video**
5. **Watch the console** for these messages:
   - `Waiting for YouTube API...` (should appear)
   - `Initializing YouTube player with video ID: -6FYfcXFxn4`
   - `YouTube player ready for video: -6FYfcXFxn4`

### 3. What to Check

✅ **Video should play** (not black screen)
✅ **Progress bar updates** as video plays
✅ **No error alerts** appear
✅ **Console shows** "YouTube player ready"

### 4. If You See Errors

The new code will show specific error messages:

| Error Code | Message | Solution |
|------------|---------|----------|
| 2 | Invalid video ID | Double-check the video ID in admin |
| 5 | Playback error | Video may have playback restrictions |
| 100 | Video not found | Check if video is public |
| 101/150 | Cannot be embedded | Enable embedding in YouTube settings |

### 5. Enable Embedding (If Needed)

If you get error 101 or 150:

1. Go to your video on YouTube
2. Click **"..."** (three dots)
3. Click **"Edit video"**
4. Go to **"Visibility"** or **"Advanced"** settings
5. Make sure **"Allow embedding"** is checked ✅
6. **Save** changes
7. Try again

### 6. Check Video Privacy

Make sure your video is:
- ✅ **Public** (works best)
- ⚠️ **Unlisted** (might work)
- ❌ **Private** (won't work)

## Console Commands for Debugging

Open browser console (F12) and run these:

```javascript
// Check if YouTube API loaded
console.log('YouTube API:', window.YT);

// Check videos in localStorage
console.log('Videos:', JSON.parse(localStorage.getItem('admin_videos')));

// Clear and retry
localStorage.clear();
location.reload();
```

## Common Issues & Solutions

### Issue: "Failed to load video player"
**Solution**:
1. Refresh the page (Ctrl+R)
2. Check browser console for specific error
3. Make sure YouTube API script is in index.html
4. Try a different browser

### Issue: Black screen
**Solution**:
1. Video ID might be wrong (check for extra spaces)
2. Video might not allow embedding
3. Video might be private

### Issue: "YouTube API not loaded"
**Solution**:
1. Check your internet connection
2. YouTube.com might be blocked
3. Clear browser cache and try again

## Quick Test Video

If your video still doesn't work, try this known working video for testing:

- Video ID: `dQw4w9WgXcQ`
- This is a public, embeddable video for testing

Add it in admin and see if it plays. If this works but yours doesn't, the issue is with your video's settings.

---

**Need More Help?**

Check the browser console (F12) and share:
1. Any error messages (red text)
2. The console logs when you select a video
3. Your video's YouTube settings (public/private, embedding allowed)
