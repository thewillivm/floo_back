const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.getAllUsers);
router.get('/search', userController.searchUsers);
router.get('/username/:username', userController.getUserByUsername);
router.get('/:id', userController.getUserById);
router.post('/follow', userController.followUser);
router.post('/unfollow', userController.unfollowUser);
router.put('/:id', userController.updateProfile);
router.put('/:id/password', userController.changePassword);

module.exports = router;
