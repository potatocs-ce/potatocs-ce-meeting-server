const router = require('express').Router();
const meetingController = require('./meeting_controller');

// /* 미팅 정보 조회  */
router.get('/meetingInfo/:meetingId', meetingController.meetingInfo);
router.get('/getParticipantState/:meetingId', meetingController.getParticipantState)

module.exports = router;
