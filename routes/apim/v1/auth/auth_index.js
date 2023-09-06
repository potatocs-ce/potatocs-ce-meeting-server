const router = require("express").Router();
const authController = require("./auth_controller");

// /* 로그인  */
router.post("/signIn", authController.signIn);
router.post("/signInTest", authController.signInTest);
// 로그아웃
router.post("/signOut", authController.signOut);
router.post("/signOutTest", authController.signOutTest);

module.exports = router;
