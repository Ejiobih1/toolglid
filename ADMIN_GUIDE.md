# Admin Page Guide

## How to Access the Admin Page

You can access the admin page in two ways:

### Option 1: Direct URL
Navigate to: `http://localhost:3000/#/admin` (development) or `https://yourdomain.com/#/admin` (production)

### Option 2: Update index.html (Production)
Add a hash route to your URL bar: `#/admin`

## Admin Login

**Default Password:** `admin123`

⚠️ **IMPORTANT:** Change the password in `src/AdminPage.js` before deploying to production!

To change the password:
1. Open `src/AdminPage.js`
2. Find line: `const ADMIN_PASSWORD = 'admin123';`
3. Change `'admin123'` to your secure password
4. Save the file

## Managing YouTube Videos

### Adding a New Video

1. Click **"Add New Video"** button
2. Fill in the form:
   - **YouTube Video ID**: The ID from your YouTube video URL
     - Example: From `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
     - Copy only: `dQw4w9WgXcQ`
   - **Video Title**: A descriptive title for users to see
   - **Video Duration (minutes)**: How long the video is
   - **Access Hours Granted**: How many hours of access users get after watching

3. Click **"Add Video"**

### Editing a Video

1. Click the **edit icon** (pencil) next to any video
2. Update the information (Note: Video ID cannot be changed)
3. Click **"Update Video"**

### Deleting a Video

1. Click the **delete icon** (trash) next to any video
2. Confirm the deletion

## How It Works

- Videos are stored in browser's **localStorage**
- The main app automatically loads videos from admin configuration
- Users must watch a video to unlock PDF tools
- Longer videos = more access time

## Video Access System

When a user watches a video:
- They get unlocked access to all PDF tools
- Access lasts for the configured hours (e.g., 3 hours, 24 hours)
- A countdown timer shows remaining access time
- When time expires, they must watch another video

### Video Watching Requirements

The system uses a simple timer-based approach:
- **Duration Timer**: Users must wait for the full video duration
- **No Related Videos**: YouTube's related videos are disabled (`rel=0` parameter)
- **Manual Unlock**: Users click "I've Watched the Video" button when ready
- **Button Enable**: Button becomes enabled after the full video duration passes
- **Honor System**: Users are trusted to watch the video during the timer

## Security Notes

1. **Change the default password** before going live!
2. Admin authentication is stored in **session storage** (cleared when browser closes)
3. Video configuration is stored in **localStorage** (persists across sessions)
4. For production, consider implementing:
   - Backend authentication
   - Database storage for videos
   - Encrypted password storage
   - Admin activity logging

## Troubleshooting

**Q: Videos not showing on main page?**
- Refresh the main page after adding videos in admin
- Check browser console for errors

**Q: Lost admin access?**
- Close and reopen browser
- Navigate back to admin page
- Re-enter password

**Q: Videos reset after refresh?**
- Videos are saved in localStorage
- Check if browser is in private/incognito mode
- Private browsing doesn't persist localStorage

## Example YouTube Video Setup

Here's a good setup for different access tiers:

| Duration | Access Hours | Use Case |
|----------|--------------|----------|
| 3-5 min  | 1 hour       | Quick access for basic tasks |
| 5-10 min | 3 hours      | Standard access for multiple files |
| 10-15 min| 12 hours     | Extended access for power users |
| 15+ min  | 24 hours     | Full day access for heavy usage |

## Getting Your YouTube Video IDs

1. Upload or find your video on YouTube
2. Click on the video to open it
3. Look at the URL in your browser
4. Copy the text after `v=`

Examples:
- `https://www.youtube.com/watch?v=VIDEO_ID_HERE` → Copy `VIDEO_ID_HERE`
- `https://youtu.be/VIDEO_ID_HERE` → Copy `VIDEO_ID_HERE`
