const router = require('express').Router();
const authController = require('./meeting_controller');

// /* 로그인  */
router.get('/meetingInfo/:meetingId', authController.meetingInfo);

module.exports = router;
