var mongoose = require('mongoose');

exports.meetingInfo = async (req, res) => {
    console.log(`
    --------------------------------------------------
      User : 
      API  : Get my Meeting
      router.get(/meetingInfo:meetingId', whiteBoardContollder.meetingInfo);
    --------------------------------------------------`);



    const dbModels = global.DB_MODELS;



    const criteria = {
        _id: req.params.meetingId
    }




    try {
        let meetingInfo = await dbModels.Meeting.findOne(criteria).populate('enlistedMembers', '-password')
            .populate('currentMembers.member_id', '-password');
        console.log(meetingInfo)
        if (meetingInfo) {

        }

        return res.send(meetingInfo);
    } catch (err) {
        return res.status(500).send('internal server error');
    }
}


exports.getParticipantState = async (req, res) => {
    console.log(`--------------------------------------------------
    API  : Get a role
    router.get('/getParticipantState', MeetingContollder.getParticipantState);
  --------------------------------------------------`);

    console.log('[[getParticipantState]] >>>>>> ', req.params.meetingId)

    const dbModels = global.DB_MODELS;

    try {
        const criteria = {
            _id: req.params.meetingId,
        }

        const currentMembers = await dbModels.Meeting.find(criteria).select('currentMembers');
        // console.log('[[ getParticipantState ]]', currentMembers)
        console.log('-------------------------------------------')


        if (!currentMembers) {
            return res.status(400).send('invalid meeting role');
        }

        return res.status(200).send(
            currentMembers
        )

    } catch (err) {

        return res.status(500).send({
            message: 'get a meeting role had an error'
        });

    }

}


// 채팅 정보 가져오기
exports.getChat = async (req, res) => {
    console.log(`
--------------------------------------------------
  API  : Get a chat
  router.get('/getChat', MeetingContollder.getChat);
--------------------------------------------------`);

    const dbModels = global.DB_MODELS;

    try {
        const criteria = {
            meetingId: req.params.meetingId,
        }

        // 원하는 값만 query 하기 공백으로 구분
        const MeetingChat = await dbModels.MeetingChat.find(criteria).select('userId chatMember createdAt chatContent');

        if (!MeetingChat) {
            return res.status(400).send('invalid meeting chat');
        }

        return res.status(200).send(
            MeetingChat
        )

    } catch (err) {

        return res.status(500).send({
            message: 'creatintg a meeting chat had an error'
        });

    }
}


exports.getVideoDrawings = async (req, res) => {
    console.log(`
    --------------------------------------------------
      API  : getVdieoDrawings
      router.get('/getVdieoDrawings/:meetingId', MeetingContollder.getVideoDrawings);
    --------------------------------------------------`);

    const dbModels = global.DB_MODELS;


    try {

        const meetingId = req.params.meetingId;

        console.log(meetingId)
        // 원하는 값만 query 하기 공백으로 구분
        const VideoDrawings = await dbModels.VideoDrawing.aggregate([
            {
                $match: {
                    meetingId: new mongoose.Types.ObjectId(meetingId)
                }
            },
            {
                $group: {
                    _id: "$targetId",
                    data: { $addToSet: { drawingEvent: "$drawingEvent", userId: "$userId" } }
                }
            }
        ])

        console.log(VideoDrawings)

        if (!VideoDrawings) {
            return res.status(400).send('invalid meeting chat');
        }

        return res.status(200).send(
            VideoDrawings
        )

    } catch (err) {
        console.error(err)
        return res.status(500).send({
            message: 'creatintg a meeting chat had an error'
        });

    }
}

exports.createChat = async (req, res) => {
    console.log(`
    --------------------------------------------------
      API  : Create a chat
      router.post('/createChat', MeetingContollder.createChat);
    --------------------------------------------------`);
    // console.log('[[createChat]] >>>>>> ', req.body)

    const dbModels = global.DB_MODELS;

    const user_name = await dbModels.Member.findOne({ _id: req.body.userId }).select('name');


    try {
        const criteria = {
            meetingId: req.body.meetingId,
            userId: req.body.userId,
            chatMember: user_name.name,
            chatContent: req.body.chatContent
        }

        const Meeting = dbModels.MeetingChat(criteria);
        // console.log("[[ createChat ]] >>>>", Meeting)
        await Meeting.save();

        return res.status(200).send(
            Meeting
        )

    } catch (err) {

        return res.status(500).send({
            message: 'creatintg a meeting chat had an error'
        });

    }
}