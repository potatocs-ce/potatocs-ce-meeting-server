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

exports.upload = async (req, res) => {
  console.log(`
  --------------------------------------------------
	User : ${req.params.meetingId}
	API  : Post my pdf
	router.post(/upload/:meetingId', meetingContollder.upload);
  --------------------------------------------------`);
  const dbModels = global.DB_MODELS;

  try {
    if (!req.params.meetingId) {
      return res.status(400).send("invalid meeting id1");
    }

    result = await dbModels.Meeting.findOne({ _id: req.params.meetingId });

    if (!result) {
      return res.status(400).send("invalid meeting id2");
    }
    // console.log(req.files[0])
    const criteria = {
      _id: new mongoose.Types.ObjectId(),
      meetingId: result._id,
      originalFileName: req.files[0].originalname,
      fileName: req.files[0].filename,
      uploadUser: "haha", // !!! user _id 로 변경? (비회원인 경우는?)
      // savePath: req.files[0].path,
      saveKey: req.files[0].key,
      fileSize: req.files[0].size,
    };
    console.log("[ key ]", req.files[0].key);

    // console.log(docObj)
    dbModels.Doc.init();
    const docData = new dbModels.Doc(criteria);
    await docData.save();
    res.send({ message: "document uploaded" });
  } catch (err) {
    console.log(err);
    res.status(500).send("internal server error");
  }
};
