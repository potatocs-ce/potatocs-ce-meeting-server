const router = require('express').Router();

const auth = require('./auth/auth_index');
const meeting = require('./meeting/meeting_index');
const doc = require('./doc/doc_index')
const survey = require('./survey/survey_index');
const { isAuthenticated } = require('../../../middlewares/auth')
router.use('/auth', auth);

router.use(isAuthenticated);
router.use('/meeting', meeting);
router.use('/doc', doc);
router.use('/survey', survey);

module.exports = router;