const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isGuest } = require('../middlewares/auth');

router.get('/login', isGuest, authController.loginForm);
router.post('/login', isGuest, authController.login);
router.get('/logout', authController.logout);

module.exports = router;
