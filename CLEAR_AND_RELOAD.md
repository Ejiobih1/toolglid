# Clear Old Videos and Load New Ones

## The Problem Was Found! ✅

Your app was loading **placeholder video IDs** like `VIDEO_ID_3MIN` instead of real YouTube videos. That's why you got the YouTube error!

## What I Fixed:

✅ Replaced all placeholder IDs with **real working YouTube videos**:
- Your video: `-6FYfcXFxn4`
- Working test videos: `ScMzIvxBSi4`, `aqz-KE-bpKQ`, `jNQXAC9IVRw`

## How to Apply the Fix:

### Option 1: Clear localStorage (Recommended)

1. Open your app: http://localhost:3000
2. Press **F12** to open browser console
3. Paste this command and press Enter:
   ```javascript
   localStorage.removeItem('admin_videos');
   localStorage.removeItem('pdf_access');
   location.reload();
   ```
4. The page will reload with the new working videos!

### Option 2: Manual Reset via Admin Page

1. Go to: http://localhost:3000/#/admin
2. Login with: `admin123`
3. Delete all the old videos (the ones with VIDEO_ID_3MIN, etc.)
4. Manually add your video:
   - Video ID: `-6FYfcXFxn4`
   - Title: "Your Video Title"
   - Duration: 5 (or actual minutes)
   - Access Hours: 1

### Option 3: Quick Console Reset

Open browser console (F12) and run:
```javascript
localStorage.setItem('admin_videos', JSON.stringify([
  { id: '-6FYfcXFxn4', title: 'Your Channel Video', duration: 5, accessHours: 1 },
  { id: 'ScMzIvxBSi4', title: 'Sample Video', duration: 1, accessHours: 3 },
  { id: 'aqz-KE-bpKQ', title: 'Test Video', duration: 2, accessHours: 12 },
  { id: 'jNQXAC9IVRw', title: 'Classic Video', duration: 1, accessHours: 24 }
]));
location.reload();
```

## After Clearing:

1. Go to: http://localhost:3000
2. Click any PDF tool
3. Click "Unlock Now"
4. You should see **4 real videos** instead of placeholder ones
5. Select any video - it should play! 🎉

## Testing:

1. **Test with working video first**: Try "Sample Video" or "Test Video" - these are guaranteed to work
2. **Then test your video**: Try "Your Channel Video" with ID `-6FYfcXFxn4`

## If Your Video Still Shows Error:

Your video (`-6FYfcXFxn4`) might have other restrictions. Try these alternatives:

1. **Check if it's age-restricted**: Age-restricted videos can't embed
2. **Check if it's for kids**: "Made for Kids" videos have embedding restrictions
3. **Test with the other videos first**: This proves the system works

## Quick Video Test:

Click this to test your video directly in iframe:
```html
https://www.youtube.com/embed/-6FYfcXFxn4?rel=0&modestbranding=1&autoplay=1
```

Open that URL in your browser:
- ✅ If it plays = Your video works in the app!
- ❌ If it shows error = Your video has embedding restrictions

## Files Modified:

- [src/App.js](src/App.js:111-118) - Updated default videos
- [src/AdminPage.js](src/AdminPage.js:28-36) - Updated default videos

---

## Summary

**Root Cause**: Placeholder video IDs like `VIDEO_ID_3MIN` were invalid

**Solution**: Replaced with real YouTube video IDs including yours (`-6FYfcXFxn4`)

**Next Step**: Clear localStorage using Option 1 above and reload!

---

**Status**: ✅ Fixed - Ready to test after localStorage clear
**Date**: 2025-12-06
