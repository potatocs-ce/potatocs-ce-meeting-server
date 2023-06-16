const router = require('express').Router();
const userController = require('./user_controller');

/* 유저정보  */
router.get('/profile', userController.profile);

module.exports = router;
