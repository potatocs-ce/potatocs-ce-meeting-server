const router = require('express').Router();

const auth = require('./auth/auth_index');
const meeting = require('./meeting/meeting_index');
const doc = require('./doc/doc_index')

router.use('/auth', auth);
router.use('/meeting', meeting);
router.use('/doc', doc);

module.exports = router;