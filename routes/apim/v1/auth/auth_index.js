const router = require("express").Router();
const authController = require("./auth_controller");

// /* 로그인  */
router.post("/signIn", authController.signIn);

// 로그아웃
router.post("/signOut", authController.signOut);

module.exports = router;
