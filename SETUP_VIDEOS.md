# Setting Up Your YouTube Videos

## Issue: Black Screen When Playing Videos

If you're seeing a black screen when trying to play videos, it's because the default video IDs are **placeholders** and not real YouTube video IDs.

## Quick Fix: Add Real YouTube Videos

You have two options:

### Option 1: Use the Admin Page (Recommended)

1. **Go to the admin page**: http://localhost:3000/#/admin
2. **Login** with password: `admin123`
3. **Delete the placeholder videos** (click the trash icon on each)
4. **Add your real YouTube videos**:
   - Click "Add New Video"
   - Get the Video ID from your YouTube video URL
   - Fill in the title, duration, and access hours
   - Click "Add Video"

### Option 2: Test with Example Videos (Quick Test)

If you don't have your own videos yet, you can test with these real YouTube videos:

1. **Go to admin page**: http://localhost:3000/#/admin
2. **Login**: `admin123`
3. **Replace the placeholder videos** with these real ones:

| Video ID | Title | Duration (min) | Access Hours |
|----------|-------|----------------|--------------|
| `dQw4w9WgXcQ` | Sample Video 1 | 3 | 1 |
| `9bZkp7q19f0` | Sample Video 2 | 4 | 3 |
| `kJQP7kiw5Fk` | Sample Video 3 | 5 | 12 |

## How to Get YouTube Video IDs

### From a YouTube URL:

**Example URL**: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`

The Video ID is: `dQw4w9WgXcQ` (everything after `v=`)

**Short URL**: `https://youtu.be/dQw4w9WgXcQ`

The Video ID is: `dQw4w9WgXcQ` (everything after `youtu.be/`)

### Steps:

1. Go to your YouTube video
2. Look at the URL in your browser
3. Copy the text after `v=` or `youtu.be/`
4. That's your Video ID!

## Current Placeholder Videos (Not Real!)

The app currently has these **PLACEHOLDER** video IDs that won't work:
- `VIDEO_ID_3MIN` ❌ Not a real video
- `VIDEO_ID_5MIN` ❌ Not a real video
- `VIDEO_ID_10MIN` ❌ Not a real video
- `VIDEO_ID_15MIN` ❌ Not a real video

## Testing the Fix

After adding real video IDs:

1. **Refresh the main page**: http://localhost:3000
2. **Click any PDF tool**
3. **Select a video**
4. **The video should now play!** ✅

## Troubleshooting

### Still seeing black screen?

1. **Check Browser Console** (F12)
   - Look for YouTube player errors
   - Error code 2 = Invalid video ID
   - Error code 5 = Video can't be played in embedded player
   - Error code 100/101/150 = Video not found or private

2. **Make sure the video**:
   - ✅ Is public (not private or unlisted might not work)
   - ✅ Allows embedding (some videos disable this)
   - ✅ Is not age-restricted
   - ✅ Is not blocked in your country

3. **Try a different video** if one doesn't work

### Video plays but progress bar doesn't work?

- This is normal - the progress tracking takes a few seconds to start
- Watch for at least 5 seconds and you should see progress

### Video plays but won't unlock access?

- Make sure you watch to 100% (don't skip)
- The progress bar should turn green
- Access unlocks automatically when video ends

## Production Setup

Before launching:

1. **Upload your own videos** to your YouTube channel
2. **Get the video IDs** from your YouTube URLs
3. **Add them via admin page**
4. **Test each video** to make sure they play
5. **Change the admin password** from `admin123` to something secure

## Example: Adding Your First Video

Let's say you uploaded a video to YouTube and got this URL:
```
https://www.youtube.com/watch?v=ABC123XYZ
```

In the admin page:
1. Click "Add New Video"
2. **YouTube Video ID**: `ABC123XYZ`
3. **Video Title**: "Welcome to PDF Tools"
4. **Video Duration**: 5 (minutes)
5. **Access Hours Granted**: 3
6. Click "Add Video"

Done! The video will now appear in your app.

---

**Need Help?**

If videos still don't work after following these steps:
1. Check the browser console (F12) for errors
2. Make sure the video is public and embeddable
3. Try using one of the example video IDs above to test
4. Verify the YouTube IFrame API is loading (check Network tab)

---

**Quick Commands:**

- **Admin Page**: http://localhost:3000/#/admin
- **Admin Password**: `admin123`
- **Reset Access**: Press `Ctrl+Shift+R` on main page
