const router = require("express").Router();
const surveyController = require("./survey_controller");

// 설문지 등록
router.post("/add", surveyController.addSurvey);
// 설문 등록
router.post("/:_id", surveyController.survey);
// 설문지 리스트 요청
router.get("/meeting/:_meetingId", surveyController.getSurveys);
// 설문지 요청
router.get("/:_id", surveyController.getSurvey);

router.get("/result/:_id", surveyController.getSurveyResult);
// 설문지 수정
router.patch("/:_id", surveyController.editSurvey);
// 설문 삭제
router.delete("/:_id", surveyController.deleteSurvey);

module.exports = router;
