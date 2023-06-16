const router = require('express').Router();

/*-----------------------------------
	Contollers
-----------------------------------*/

const meetingController = require('./meeting/meeting_controller')


// // meeting
// router.post('/create-meeting', meetingController.createMeeting);
// router.get('/update-meeting', meetingController.updateMeeting);
// router.post('/join-meeting', meetingController.joinMeeting)
// router.get('/get-join-meeting', meetingController.getJoinMeeting)

// realTime
router.get('/getMeetingData', meetingController.getMeetingData)
router.get('/getUserData/:userId', meetingController.getUserData)
// realTime chat
router.post('/createChat', meetingController.createChat)
router.get('/getChat', meetingController.getChat)
router.delete('/deleteChat', meetingController.deleteChat)
router.delete('/deleteAllOfChat', meetingController.deleteAllOfChat)
// realTime members state
router.get('/getParticipantState', meetingController.getParticipantState)
router.get('/getOnlineTrue', meetingController.getOnlineTrue)
router.get('/getOnlineFalse', meetingController.getOnlineFalse)
// realTime members role
router.get('/getRoleUpdate', meetingController.getRoleUpdate)
// realTime meeting status
router.get('/getMeetingStatus', meetingController.getMeetingStatus)

module.exports = router;