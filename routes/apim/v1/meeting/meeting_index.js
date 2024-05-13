const router = require('express').Router();
const meetingController = require('./meeting_controller');

// /* 미팅 정보 조회  */
router.get('/meetingInfo/:meetingId', meetingController.meetingInfo);

// 미팅 참여자 정보 조회
router.get('/getParticipantState/:meetingId', meetingController.getParticipantState);

// 미팅 채팅 정보 조회
router.get('/getChat/:meetingId', meetingController.getChat);

router.get('/getVideoDrawings/:meetingId', meetingController.getVideoDrawings)

// 채팅 데이터 저장
router.post('/createChat', meetingController.createChat);

router.post('/clearVideoDrawing', meetingController.clearVideoDrawing);

module.exports = router;
