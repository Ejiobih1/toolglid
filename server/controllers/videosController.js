const { query } = require('../database/db');

/**
 * Get all videos
 */
const getAllVideos = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, title, duration, access_hours, created_at FROM videos ORDER BY created_at DESC'
    );

    res.json({
      videos: result.rows
    });

  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({
      error: 'Failed to fetch videos'
    });
  }
};

/**
 * Add new video (Admin only)
 */
const addVideo = async (req, res) => {
  try {
    const { id, title, duration, accessHours } = req.body;

    // Validation
    if (!id || !title || !duration || !accessHours) {
      return res.status(400).json({
        error: 'All fields are required',
        required: ['id', 'title', 'duration', 'accessHours']
      });
    }

    // Check if video already exists
    const existing = await query(
      'SELECT id FROM videos WHERE id = $1',
      [id]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: 'Video with this ID already exists'
      });
    }

    // Insert video
    const result = await query(
      `INSERT INTO videos (id, title, duration, access_hours)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, title, parseInt(duration), parseInt(accessHours)]
    );

    res.status(201).json({
      message: 'Video added successfully',
      video: result.rows[0]
    });

    console.log(`✅ Video added: ${id} - ${title}`);

  } catch (error) {
    console.error('Add video error:', error);
    res.status(500).json({
      error: 'Failed to add video',
      message: error.message
    });
  }
};

/**
 * Update video (Admin only)
 */
const updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, duration, accessHours } = req.body;

    const result = await query(
      `UPDATE videos
       SET title = COALESCE($1, title),
           duration = COALESCE($2, duration),
           access_hours = COALESCE($3, access_hours),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [title, duration ? parseInt(duration) : null, accessHours ? parseInt(accessHours) : null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Video not found'
      });
    }

    res.json({
      message: 'Video updated successfully',
      video: result.rows[0]
    });

    console.log(`✅ Video updated: ${id}`);

  } catch (error) {
    console.error('Update video error:', error);
    res.status(500).json({
      error: 'Failed to update video',
      message: error.message
    });
  }
};

/**
 * Delete video (Admin only)
 */
const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM videos WHERE id = $1 RETURNING id, title',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Video not found'
      });
    }

    res.json({
      message: 'Video deleted successfully',
      video: result.rows[0]
    });

    console.log(`✅ Video deleted: ${id}`);

  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({
      error: 'Failed to delete video',
      message: error.message
    });
  }
};

module.exports = {
  getAllVideos,
  addVideo,
  updateVideo,
  deleteVideo
};
