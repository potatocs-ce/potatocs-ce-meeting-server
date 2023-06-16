const { ObjectId } = require('bson');

exports.requestLeave = async (req, res) => {
	console.log(`
--------------------------------------------------  
  API  : Reqeust Leave
  User: ${req.decoded._id}
  router.post('/request-leave', leaveMngmtCtrl.requestLeave) 
--------------------------------------------------`);

	const dbModels = global.DB_MODELS;
	
	try {

		const findMyManagerCriteria = {
			myId: req.decoded._id,
			accepted: true
		}

		const getManagerData = await dbModels.Manager.findOne(findMyManagerCriteria);
		// console.log(getManagerData);

		req.body.requestor = req.decoded._id;
		req.body.approver = getManagerData.myManager;

		// console.log(req.body);

		const newLeaveRequest = dbModels.LeaveRequest(req.body);

		await newLeaveRequest.save();

		return res.status(200).send({
			message: 'requested'
		});
			
	} catch (err) {
		return res.status(500).send({
			message: 'DB Error'
		});
	}
};

exports.getMyLeaveStatus = async (req, res) => {

	console.log(`
--------------------------------------------------
  User : ${req.decoded._id}
  API  : Get My Leave status
  router.get('/my-status', leaveMngmtCtrl.getMyLeaveStatus);
--------------------------------------------------`);

	// total >> used_leave + memeber_leave with a condition, leaveType
	// used_leave 에 있는 사용된 휴가
	// 현재 member에 있는 나의 휴가
		const dbModels = global.DB_MODELS;

	try {
		
		const userLeaveStatus = await dbModels.Member.aggregate([
			{
				$match: {
					_id: ObjectId(req.decoded._id),
				}
			},
			{
				$lookup: {
					from: 'usedleaves',
					localField: '_id',
					foreignField: 'requestor',
					as: 'usedLeaveInfo'
				}
			},
			{
				$unwind: {
					path: '$usedLeaveInfo',
					preserveNullAndEmptyArrays: true
				}
			},
		]);
		
		console.log(userLeaveStatus);


	} catch (err) {

		return res.status(500).send({
			message: 'DB Error'
		});

	}

	return res.status(200).send({                                                                                     
		message: 'my status test'
	})
};