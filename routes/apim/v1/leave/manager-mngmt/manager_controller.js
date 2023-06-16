const member = require('../../../../../models/member_schema');
const manager = require('../../../../../models/manager_schema');

exports.getManager = async (req, res) => {
	console.log(`
--------------------------------------------------
  User : ${req.decoded._id}
  API  : Get Manager Info
  router.get('/get-manager', managerMngmtCtrl.getManager);
  
--------------------------------------------------`);
	try {
		const criteria = {
			myId: req.decoded._id
		}

		const projection = 'myManager myId accepted';

		const requestedManager = await manager.findOne(criteria, projection);
		// console.log('requested findManager', requestedManager);

		if(!requestedManager) {
			return res.status(200).send({
				message: 'findManager'
			});
		}

		const managerCriteria = {
			_id: requestedManager.myManager
		};

		const managerProjection = 'email name isManager profile_img';
		
		const managerInfo = await member.findOne(managerCriteria, managerProjection);
		// console.log('managerInfo', managerInfo);

		const getManager = {
			_id: requestedManager._id,
			accepted: requestedManager.accepted,
			email: managerInfo.email,
			name: managerInfo.name,
			profile_img: managerInfo.profile_img,
		}
		// console.log(returnData);

		return res.status(200).send({
			message: 'get Manager test',
			getManager
		})

	} catch (err) {
		// console.log(err);
		return res.status(500).send({
			message: 'DB Error'
		});
	}
};

exports.findManager = async (req, res) => {
	console.log(`
--------------------------------------------------
  User : ${req.decoded._id}
  API  : Find My Manager
  router.get('/find-manager/:id', managerMngmtCtrl.findManager);
  
  manager_email_id : ${req.params.id}
--------------------------------------------------`);

	try {

		const criteria = {
			email: req.params.id
		}
	
		const projection = 'email name profile_img mobile department';

		const user = await member.findOne(criteria, projection);
		// console.log(user);
		if(!user) {
			return res.status(400).send({
				message: 'Cannot find the manager'
			});
		}

		return res.status(200).send({
			user
		});

	} catch (err) {

		return res.status(500).send('DB Error');

	}
	
};

exports.addManager = async (req, res) => {
	console.log(`
--------------------------------------------------
	User : ${req.decoded._id}
	API  : Add Manager
	router.get('/add-manager', managerMngmtCtrl.addManager);

	manager_id : ${req.body.manager_id}
--------------------------------------------------`);

	try {
		
		const newManager = manager({
			myManager: req.body.manager_id,
			myId: req.decoded._id,
			accepted: false,
			requestedDate: new Date()
		});
	
		await newManager.save();

		res.send({
			message: 'requested'
		});


	} catch (err) {
		// console.log(err);
		return res.status(500).send({
			message: 'DB Error'
		});
	}

};

/*
	manager_schema 안에 데이터가 있을 때
	accepted => false = 펜딩중 true = 수락 후 매니저/직원 관계
*/
exports.cancelPending = async (req, res) => {
	console.log(`
--------------------------------------------------
	User : ${req.decoded._id}
	API  : Cancel addManager Pending
	router.delete('/cancel-pending', managerMngmtCtrl.cancelPending);

	manager_id : ${req.params.id}
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