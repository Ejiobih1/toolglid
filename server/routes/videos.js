const express = require('express');
const router = express.Router();
const { getAllVideos, addVideo, updateVideo, deleteVideo } = require('../controllers/videosController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Public route - anyone can get videos
router.get('/', getAllVideos);

// Admin routes - require authentication and admin privileges
router.post('/', verifyToken, verifyAdmin, addVideo);
router.put('/:id', verifyToken, verifyAdmin, updateVideo);
router.delete('/:id', verifyToken, verifyAdmin, deleteVideo);

module.exports = router;
