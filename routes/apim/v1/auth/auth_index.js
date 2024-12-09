const router = require('express').Router();
const authController = require('./auth_controller');

// /* 로그인  */
router.post('/signIn', authController.signIn);

router.get('/getUserInfo/:userId', authController.getUserInfo)

module.exports = router;
