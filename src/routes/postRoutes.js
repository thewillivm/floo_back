const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const upload = require('../middleware/uploadMiddleware');

router.get('/', postController.getAllPosts);
router.get('/search', postController.searchPosts);
router.get('/:id', postController.getPostById);
router.post('/', upload.single('file'), postController.createPost);

module.exports = router;
