
const { ObjectId } = require('mongodb')

exports.survey = async (req, res) => {
    console.log(`
--------------------------------------------------
  User : 
  API  : survey
  router.post('/survey/:_id', surveyController.survey);
--------------------------------------------------
    `)

    const dbModels = global.DB_MODELS;
    const body = req.body;
    const _id = req.params._id;
    const user_id = req.decoded._id

    try {
        await dbModels.Survey_Result({ survey_id: _id, result: body, user_id }).save();

        res.status(200).json({ status: true })
    } catch (err) {
        console.log('[ERROR]', err);
        res.status(500).send({
            message: "An error occured while survey"
        })
    }
}


/**
 * @desciprtion 설문지 등록
 * @param {*} req 
 * @param {*} res 
 */
exports.addSurvey = async (req, res) => {
    console.log(`
--------------------------------------------------
  User : 
  API  : add
  router.post('/survey/add', surveyController.addSurvey);
--------------------------------------------------
    `)
    // 로그인한 사용자의 id
    const { _id } = req.decoded
    const userId = req.decoded._id; // 조회를 시도한 유저의 아이디

    const dbModels = global.DB_MODELS;
    const body = req.body;
    body.userId = _id;
    try {
        await dbModels.Survey(body).save();


        res.status(200).json({ status: true })
    } catch (err) {
        console.error("[ ERROR ]", err);
        res.status(500).send({
            status: false,
            message: "An error occured while adding survey"
        })
    }
}


/**
 * @description 설문지 삭제
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
exports.deleteSurvey = async (req, res) => {
    console.log(`
--------------------------------------------------
  User : 
  API  : delete/:_id
  router.post('/survey/delete/:_id', surveyController.deleteSurvey);
--------------------------------------------------
    `)

    const dbModels = global.DB_MODELS;
    const _id = req.params._id;
    try {
        // 응답 기록 삭제
        await dbModels.Survey_Result.deleteMany({ survey_id: _id });

        // 설문지 삭제
        await dbModels.Survey.deleteOne({ _id })

        // 성공 응답
        return res.status(200).json({ status: true })
    } catch (err) {
        console.log("[ ERROR ]", err);
        return res.status(500).send({
            message: "An error occured while getting survey"
        })
    }
}

/**
 * @description 설문지 수정
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
exports.editSurvey = async (req, res) => {
    console.log(`
--------------------------------------------------
  User : 
  API  : edit/:_id
  router.post('/survey/edit/:_id', surveyController.editSurvey);
--------------------------------------------------
    `)
    const dbModels = global.DB_MODELS;
    const _id = req.params._id;
    const { title, description, cards } = req.body;

    try {
        await dbModels.Survey.updateOne({ _id }, {
            $set: {
                title, description, cards
            }
        });
        return res.status(200).json({ status: true })
    } catch (err) {
        console.log("[ ERROR ]", err);
        return res.status(500).send({
            message: "An error occured while getting survey"
        })
    }
}


/**
 * @description 설문지 리스트 요청
 * @param {*} req 
 * @param {*} res 
 */
exports.getSurveys = async (req, res) => {
    console.log(`
    --------------------------------------------------
      User : 
      API  : getSurveys
      router.get('/survey', surveyController.getSurveys);
    --------------------------------------------------
        `)

    const userId = req.decoded._id; // 조회를 시도한 유저의 아이디
    const dbModels = global.DB_MODELS;
    const meetingId = req.params._meetingId;
    console.log(meetingId)
    try {
        // const surveys = await dbModels.Survey.find({ meetingId }).select({ title: 1, description: 1, createdAt: 1 });
        // console.log(userId)
        const surveys = await dbModels.Survey.aggregate([
            {
                $match: { meetingId: new ObjectId(meetingId) }
            },
            {
                $lookup: {
                    from: "survey_results",
                    localField: "_id",
                    foreignField: "survey_id",
                    as: 'results'
                }
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    description: 1,
                    createdAt: 1,
                    userId: 1,
                    participated: {
                        $anyElementTrue: {
                            $map: {
                                input: "$results",
                                as: "result",
                                in: { $eq: ["$$result.user_id", new ObjectId(userId)] }
                            }
                        }
                    }
                }
            }
        ])

        res.status(200).json(surveys);
    } catch (err) {
        console.log("[ ERROR ]", err);
        return res.status(500).send({
            message: "An error occured while getting survey"
        })
    }
}


/**
 * @description 설문지 정보 요청
 * @param {*} req 
 * @param {*} res 
 */
exports.getSurvey = async (req, res) => {
    console.log(`
    --------------------------------------------------
      User : 
      API  : getSurvey
      router.get('/survey/:_id', surveyController.getSurvey);
    --------------------------------------------------
        `)

    const dbModels = global.DB_MODELS;
    const _id = req.params._id;
    try {
        const survey = await dbModels.Survey.findOne({ _id })

        res.status(200).json(survey);
    } catch (err) {
        console.log("[ ERROR ]", err);
        res.status(500).send({
            message: "An error occured while getting survey"
        })
    }
}


exports.getSurveyResult = async (req, res) => {
    console.log(`
    --------------------------------------------------
      User : 
      API  : getSurveyResult
      router.get('/surveyResult/:_id', surveyController.getSurveyResult);
    --------------------------------------------------
        `)

    const dbModels = global.DB_MODELS;
    const _id = req.params._id;

    try {
        const results = await dbModels.Survey_Result.find({ survey_id: _id })
        return res.status(200).json(results)
    } catch (err) {
        console.log("[ ERROR ]", err);
        return res.status(500).send({
            message: "An error occured while getting survey result"
        })
    }
}