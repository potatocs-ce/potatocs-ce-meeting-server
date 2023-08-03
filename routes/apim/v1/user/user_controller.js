const member = require("../../../../models/member_schema");

exports.profile = async (req, res) => {
  console.log(`
--------------------------------------------------
  User Profile: ${req.decoded._id}
  router.get('/profile', userController.profile) 
--------------------------------------------------`);

  const criteria = { _id: req.decoded._id };
  const projection = {
    password: false,
    createdAt: false,
    updatedAt: false,
  };

  try {
    const meetingResult = await dbModels.Meeting.findOne(criteria);

    const docResult = await dbModels.Doc.find(criteria).select({
      saveKey: 0,
      meetingId: 0,
    });
    res.send({ meetingResult: meetingResult, docResult: docResult });


    const user = await member.findOne(criteria, projection);
    // console.log(user);
    if (!user) {
      return res.status(401).send({
        message: "An error has occured",
      });
    }
    return res.send({
      user,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send("db Error");
  }
};
