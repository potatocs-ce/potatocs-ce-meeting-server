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
        let meetingInfo = await dbModels.Meeting.findOne(criteria).populate('enlistedMembers');
        console.log(meetingInfo)
        if (meetingInfo) {

        }

        return res.send(meetingInfo);
    } catch (err) {
        return res.status(500).send('internal server error');
    }
}