const router = require('express').Router();

// const { isAuthenticated } = require('../../../middlewares/auth');

const auth = require('./auth/auth_index');
// const user = require('./user/user_index');
// const leave = require('./leave/leave_index');
const collab = require('./collab/collab_index');

const whiteBoard = require('./whiteBoard/whiteBoard_index');

/*-----------------------------------
	not needed to verify
-----------------------------------*/
router.use('/auth', auth);

/*-----------------------------------
	Token verify
-----------------------------------*/
// router.use(isAuthenticated);

/*-----------------------------------
	API
-----------------------------------*/
// router.use('/user', user);
// router.use('/leave', leave);
router.use('/collab', collab);


/*-----------------------------------
	white Board
-----------------------------------*/
router.use('/whiteBoard', whiteBoard);





module.exports = router;