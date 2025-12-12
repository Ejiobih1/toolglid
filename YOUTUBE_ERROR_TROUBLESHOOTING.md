# YouTube Playback Error - Troubleshooting Guide

## Error Message
```
An error occurred. Please try again later. (Playback ID: xxxxxxxx)
```

This error appears when YouTube cannot play a video in the embedded iframe player.

## Common Causes & Solutions

### 1. **Video Has Embedding Disabled**

**Problem**: Some YouTube videos have embedding disabled by the creator.

**How to Check**:
1. Click the "Open video on YouTube →" link below the player
2. If the video opens and plays on YouTube, but NOT in the iframe, embedding is disabled

**Solution**:
- Use a different video that allows embedding
- If it's your video, enable embedding:
  1. Go to YouTube Studio
  2. Select the video
  3. Go to "Visibility" settings
  4. Under "Advanced settings" → "Distribution options"
  5. Enable "Allow embedding"

### 2. **Video is Private or Unlisted (Incorrectly)**

**Problem**: Private videos cannot be embedded.

**Solution**:
- Make sure your video is set to "Public" or "Unlisted" (with embedding enabled)
- Go to YouTube Studio → Videos → Select video → Visibility → Choose "Public"

### 3. **Video is Age-Restricted**

**Problem**: Age-restricted videos cannot play in embedded players without authentication.

**Solution**:
- Use a non-age-restricted video
- If it's your video, check YouTube Studio for age restriction settings

### 4. **Video ID is Invalid or Placeholder**

**Problem**: The video ID hasn't been set up properly (e.g., still says "VIDEO_ID_3MIN")

**How to Check**:
- Look at the "Video ID" shown below the player
- It should be 11 characters long (e.g., `-6FYfcXFxn4`)

**Solution**:
1. Go to admin page: http://localhost:3000/#/admin
2. Delete any videos with placeholder IDs
3. Add your real video with the correct ID from YouTube

### 5. **Copyright or Content ID Issues**

**Problem**: Video has copyright claims that prevent embedding.

**Solution**:
- Check YouTube Studio for copyright claims
- Use a different video without copyright issues
- For your own original content, this shouldn't be an issue

## How to Get a Working Video ID

### Your Video: `https://youtu.be/-6FYfcXFxn4`

1. **Check if Embedding is Enabled**:
   - Go to: https://www.youtube.com/watch?v=-6FYfcXFxn4
   - Click "Share" → "Embed"
   - If you see an embed code, embedding is enabled ✅
   - If you see "Video cannot be embedded", you need to enable it ❌

2. **Test with a Known Working Video**:

   Try these public videos that allow embedding:

   | Video Title | Video ID | Description |
   |-------------|----------|-------------|
   | YouTube Test Video | `aqz-KE-bpKQ` | Short test video |
   | Big Buck Bunny | `aqz-KE-bpKQ` | Creative Commons video |
   | Sample Video | `ScMzIvxBSi4` | Public domain |

3. **Add Working Video to Test**:
   - Admin page: http://localhost:3000/#/admin
   - Add new video with ID: `aqz-KE-bpKQ`
   - Title: "Test Video"
   - Duration: 1
   - Access Hours: 1
   - Test it!

## Step-by-Step Fix for Your Video

### Option A: Enable Embedding for Your Video

1. Go to YouTube Studio: https://studio.youtube.com
2. Click "Content" in left menu
3. Find your video (ID: `-6FYfcXFxn4`)
4. Click on the video
5. Click "Visibility" tab
6. Scroll down to "Advanced settings"
7. Find "Allow embedding" checkbox
8. ✅ Check "Allow embedding"
9. Click "Save"
10. Test again in your app

### Option B: Use a Test Video First

1. Go to admin page: http://localhost:3000/#/admin
2. Add this working test video:
   - Video ID: `aqz-KE-bpKQ`
   - Title: "Test Video"
   - Duration: 1 minute
   - Access Hours: 1 hour
3. Save and test
4. Once working, add your real video

## Debugging Steps

### 1. Check What Video ID is Being Used

When you select a video, look at the troubleshooting box below the player. It shows:
- **Video ID**: The actual ID being embedded
- **Link**: Click to open on YouTube

### 2. Test Direct YouTube Link

Click the "Open video on YouTube →" link:
- If it works on YouTube but NOT in iframe → Embedding disabled
- If it doesn't work on YouTube either → Video is private/deleted
- If it shows age restriction → Cannot embed

### 3. Check Browser Console

Open browser console (F12):
```javascript
// Check current videos in localStorage
JSON.parse(localStorage.getItem('admin_videos'))
```

This shows all configured videos and their IDs.

### 4. Test with Different Browser

Sometimes browser extensions block embedded videos:
- Try in Incognito/Private mode
- Try a different browser
- Disable ad blockers temporarily

## Quick Fix: Use Test Videos

If you need to test the app quickly, here are some guaranteed working video IDs:

```javascript
// Add these via admin page:

{
  "id": "ScMzIvxBSi4",
  "title": "Sample Test Video (30 sec)",
  "duration": 1,
  "accessHours": 1
}

{
  "id": "jNQXAC9IVRw",
  "title": "Me at the zoo (First YouTube Video)",
  "duration": 1,
  "accessHours": 1
}
```

## Still Not Working?

### Check Video Settings on YouTube

1. Open your video on YouTube: https://www.youtube.com/watch?v=-6FYfcXFxn4
2. Click "Share"
3. Click "Embed"
4. Look for error messages

### Try Without Autoplay

If autoplay is causing issues, we can remove it:

**Current URL**:
```
https://www.youtube.com/embed/-6FYfcXFxn4?rel=0&modestbranding=1&autoplay=1
```

**Try without autoplay**:
```
https://www.youtube.com/embed/-6FYfcXFxn4?rel=0&modestbranding=1&autoplay=0
```

Let me know if you need to disable autoplay!

## Contact Info Needed

To help debug further, please provide:

1. **Does your video work on YouTube?**
   - Test link: https://www.youtube.com/watch?v=-6FYfcXFxn4

2. **What's the exact video ID in the admin page?**
   - Should be: `-6FYfcXFxn4`

3. **Can you share the video?**
   - Is it public?
   - Is embedding enabled?

4. **Screenshot of the error?**
   - This helps identify the exact YouTube error code

---

## Summary

**Most Common Fix**: Enable embedding in YouTube Studio

**Quick Test**: Use video ID `aqz-KE-bpKQ` to verify the system works

**Your Video**: Check embedding settings for ID `-6FYfcXFxn4`

---

**Status**: Troubleshooting Guide
**Date**: 2025-12-06
**Your Video ID**: `-6FYfcXFxn4`
