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