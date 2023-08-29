const member = require('../../../../../models/member_schema');
const manager = require('../../../../../models/manager_schema');
const { ObjectId } = require('bson');

exports.getPendingList = async (req, res) => {
	console.log(`
--------------------------------------------------
  User : ${req.decoded._id}
  API  : Get Pending List
  router.get('/pending-list', employeeMngmtCtrl.getPendingList);
--------------------------------------------------`);
	const dbModels = global.DB_MODELS;

	try {
		const pendingList = await dbModels.Manager.aggregate([
			{
				$match: {
					myManager: ObjectId(req.decoded._id),
					accepted: false
				}
			},
			{
				$lookup: {
					from: 'members',
					localField: 'myId',
					foreignField: '_id',
					as: 'requesterInfo'
				},
			},
			{
				$unwind: {
					path: '$requesterInfo',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$project: {
					_id: 1,
					myId: 0,
					myManager: 0,
					accepted: 0,
					'requesterInfo.password': 0,
				}
			}
		]);

		// console.log(pendingList)

		return res.status(200).send({
			message: 'found',
			pendingList
		});

	} catch (err) {
		return res.status(500).send({
			message: 'DB Error'
		});
	}
};

exports.cancelRequest = async (req, res) => {
	console.log(`
--------------------------------------------------
	User : ${req.decoded._id}
	API  : Cancel Employee's request
	router.delete('/cancel-request', employeeMngmtCtrl.cancelRequest);

	manager_id  : ${req.params.id}
--------------------------------------------------`);

	try {

		const criteria = {
			_id: req.params.id
		}

		await manager.deleteOne(criteria);

		return res.status(200).send({
			message: 'canceled'
		});

	} catch (err) {
		return res.status(500).send({
			message: 'DB Error'
		});
	}

};

exports.acceptRequest = async (req, res) => {
	console.log(`
--------------------------------------------------  
	User : ${req.decoded._id}  
	API  : put acceptRequest
	router.put('/accept-request', employeeMngmtCtrl.acceptRequest) 
	query: ${JSON.stringify(req.body)} docId, userId
--------------------------------------------------`);

	const dbModels = global.DB_MODELS;

	try {
		// 휴가 승인 업데이트
		const updatedRequest = await dbModels.LeaveRequest.findOneAndUpdate(criteria, updateData);
		// const updatedRequest = await dbModels.LeaveRequest.findOne(criteria);
		if (!updatedRequest) {
			return res.status(404).send('the update1 has failed');
		}

		// 해당 직원 정보 > 가지고 있는 휴가처리 (마이너스 처리)
		const findRequestor = {
			_id: updatedRequest.requestor
		}
		const requestorInfo = await dbModels.Member.findOne(findRequestor);
		if (!updatedRequest) {
			return res.status(404).send('the update2 has failed');
		}
		// console.log('leftLeave before >>', requestorInfo);
		// 처리과정
		const leftLeave = requestorInfo[updatedRequest.leaveType] - updatedRequest.leaveDuration

		if (updatedRequest.leaveType == 'annual_leave') {
			updateRequestorLeave = {
				annual_leave: leftLeave
			}
		} else if (updatedRequest.leaveType == 'sick_leave') {
			updateRequestorLeave = {
				sick_leave: leftLeave
			}
		} else if (updatedRequest.leaveType == 'replacementday_leave') {
			updateRequestorLeave = {
				replacementday_leave: leftLeave
			}
		}

		// 처리후 업데이트
		const updateRequestorInfo = await dbModels.Member.findOneAndUpdate(findRequestor, updateRequestorLeave);
		if (!updateRequestorInfo) {
			return res.status(404).send('the update3 has failed');
		}

		// used_leave_schema 에 남기기 requestor, leaveType, leaveDuration
		const usedLeaveData = {
			requestor: updatedRequest.requestor,
			leaveType: updatedRequest.leaveType,
			leaveDuration: updatedRequest.leaveDuration
		}
		const usedLeaveRes = dbModels.UsedLeave(usedLeaveData);
		const updateCriteria = {
			_id: req.body.docId,
			myId: req.body.userId
		}

		const updateData = {
			accepted: true
		}

		const updatedData = await dbModels.Manager.findOneAndUpdate(updateCriteria, updateData);
		if (!updatedData) {
			return res.status(404).send('the update has failed');
		}


		console.log(updatedData);

		const criteria = {
			_id: req.decoded._id
		}

		const updateManagerData = {
			isManager: true
		}

		const updatedUser = await dbModels.Member.findOneAndUpdate(criteria, updateManagerData);
		if (!updatedUser) {
			return res.status(404).send('the user update has failed');
		}

		return res.status(200).send({
			message: 'accepted'
		});

	} catch (err) {
		return res.status(500).send({
			message: 'DB Error'
		});
	}

};

exports.myEmployeeList = async (req, res) => {
	console.log(`
--------------------------------------------------
  User : ${req.decoded._id}
  API  : Get my Employee List
  router.get('/myEmployee-list', employeeMngmtCtrl.myEmployeeList);
--------------------------------------------------`);

	const dbModels = global.DB_MODELS;

	try {

		// 관리하고 있는 직원들 in manager
		// myManager > 매니저 아이디, myId > 직원 아이디, accepted: true or false, 펜딩 or 수락

		const myEmployeeList = await dbModels.Manager.aggregate([
			{
				$match: {
					myManager: ObjectId(req.decoded._id),
					accepted: true
				}
			},
			{
				$lookup: {
					from: 'members',
					localField: 'myId',
					foreignField: '_id',
					as: 'myEmployeeInfo'
				},
			},
			{
				$unwind: {
					path: '$myEmployeeInfo',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$project: {
					_id: 1,
					myEmployeeId: '$myEmployeeInfo._id',
					name: '$myEmployeeInfo.name',
					annual_leave: '$myEmployeeInfo.annual_leave',
					sick_leave: '$myEmployeeInfo.sick_leave',
					replacementday_leave: '$myEmployeeInfo.replacementday_leave',
					location: '$myEmployeeInfo.location',
					emp_start_date: '$myEmployeeInfo.emp_start_date',
					emp_end_date: '$myEmployeeInfo.emp_end_date',
					position: '$myEmployeeInfo.position'
				}
			}
		]);

		console.log(myEmployeeList);

		return res.status(200).send({
			message: 'found',
			myEmployeeList
		});
	} catch (err) {
		return res.status(500).send({
			message: 'DB Error'
		});
	}

};

exports.getEmployeeInfo = async (req, res) => {
	console.log(`
--------------------------------------------------
  User : ${req.decoded._id}
  API  : Get my Employee Info to edit
  router.get('/employee-info', employeeMngmtCtrl.getEmployeeInfo);
  a employee_id : ${req.params.id}
--------------------------------------------------`);

	const dbModels = global.DB_MODELS;

	try {

		const criteria = {
			_id: req.params.id
		}

		const projection = 'name position location emp_start_date emp_end_date annual_leave sick_leave replacementday_leave';

		const employee = await dbModels.Member.findOne(criteria, projection);
		// console.log(employee);
		if (!employee) {
			return res.status(400).send({
				message: 'Cannot find the manager'
			});
		}

		return res.status(200).send({
			message: 'found',
			employee
		});

	} catch (err) {

		return res.status(500).send('DB Error');

	}
};

exports.UpdateEmployeeInfo = async (req, res) => {
	console.log(`
--------------------------------------------------  
	User : ${req.decoded._id}  
	API  : put UpdateEmployeeInfo
	router.put('/put-employee-info', employeeMngmtCtrl.UpdateEmployeeInfo) 
	query: ${JSON.stringify(req.body)} update UserInfo
--------------------------------------------------`);

	const dbModels = global.DB_MODELS;

	try {

		const criteria = {
			_id: req.body.employeeId
		}

		const updateData = {
			name: req.body.name,
			position: req.body.position,
			location: req.body.location,
			emp_start_date: req.body.emp_start_date,
			emp_end_date: req.body.emp_end_date,
			annual_leave: req.body.annual_leave,
			sick_leave: req.body.sick_leave,
			replacementday_leave: req.body.replacementday_leave,
		}

		const employee = await dbModels.Member.findOneAndUpdate(criteria, updateData);

		if (!employee) {
			return res.status(400).send({
				message: 'Cannot find the manager'
			});
		}

		return res.status(200).send({
			message: 'updated',

		});

	} catch (err) {

		return res.status(500).send('DB Error');

	}

};
