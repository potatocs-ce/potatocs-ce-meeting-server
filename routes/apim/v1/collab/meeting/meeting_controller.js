const { ObjectId } = require('bson');

/* 
	Get Meeting Data
*/
exports.getMeetingData = async (req, res) => {

	console.log(`
--------------------------------------------------
  User : 
  API  : Get my Meeting
  router.get(/getMeetingData', meetingContollder.getMeetingData);
--------------------------------------------------`);
	const dbModels = global.DB_MODELS;

	const meetingId = req.query.meetingId;
	// console.log('[[ meetingId ]]', meetingId)

	const criteria = {
		_id: req.query.meetingId,
	}


	try {
		const meetingData = await dbModels.Meeting.findOne(criteria).populate('enlistedMembers')
		// console.log('[[ getMeetingData ]]', meetingData)
		console.log('-------------------------------------------')

		return res.send({
			success: true,
			meetingData,
		});
	} catch (err) {
		console.log('[ ERROR ]', err);
		res.status(500).send('getMeetingData Error')
	}

}


/* 
	Get User Data
*/
exports.getUserData = async (req, res) => {

	console.log(`
--------------------------------------------------
  User : 
  API  : Get my UserData
  router.get(/getUserData', meetingContollder.getUserData);
--------------------------------------------------`);
	const dbModels = global.DB_MODELS;

	const userId = req.params.userId;
	// console.log('[[ userId ]]', userId)

	const criteria = {
		_id: req.params.userId,
	}


	try {
		const userData = await dbModels.Member.findOne(criteria);
		// console.log('[[ getuserData ]]', userData)
		console.log('-------------------------------------------')


		if(!userData) {
			// console.log('No Matched Account');
			return res.status(404).send({
				message: 'not found'
			});
		}

		return res.send({
			userData: userData
		});
	} catch (err) {
		console.log('[ ERROR ]', err);
		res.status(500).send('getuserData Error')
	}

}


/*
	Create a chat
*/
exports.createChat = async (req, res) => {
	console.log(`
--------------------------------------------------
  API  : Create a chat
  router.post('/createChat', MeetingContollder.createChat);
--------------------------------------------------`);
	// console.log('[[createChat]] >>>>>> ', req.body)

	const dbModels = global.DB_MODELS;

	try {
		const criteria = {
			meetingId: req.body.meetingId,
			userId: req.body.userId,
			chatMember: req.body.chatMember,
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


/*
	Get a chat
*/
exports.getChat = async (req, res) => {
	console.log(`
--------------------------------------------------
  API  : Get a chat
  router.get('/getChat', MeetingContollder.getChat);
--------------------------------------------------`);
	// console.log('[[getChat]] >>>>>> ', req.query.meetingId)

	const dbModels = global.DB_MODELS;

	try {
		const criteria = {
			meetingId: req.query.meetingId,
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


/*
	Delete a chat
*/
exports.deleteChat = async (req, res) => {
	console.log(`
--------------------------------------------------
  API  : Get a chat
  router.delete('/deleteChat', MeetingContollder.deleteChat);
--------------------------------------------------`);
	// console.log('[[deleteChat meetingId]] >>>>>> ', req.query.chatId)

	const dbModels = global.DB_MODELS;

	try {

        if (!req.query.chatId) {
            return res.status(400).send('invalid meeting id1');
        }

        const criteria = {
            _id: req.query.chatId,
        }

        // meetingId에 해당하는 채팅 query
        const deleteChat = await dbModels.MeetingChat.findOne(criteria);

		// console.log(deleteChat)

        if (!deleteChat) {
            return res.status(400).send('invalid meeting chat');
        }

        
		// DB에 업로드 된 해당 채팅도 함께 삭제
		await dbModels.MeetingChat.deleteOne(criteria);
        
		return res.status(200).send({
			message: 'deleted'
		})

    } catch (err) {
        console.log(err);
        res.status(500).send('internal server error');
    }

}


/*
	Delete All of chat
*/
exports.deleteAllOfChat = async (req, res) => {
	console.log(`
--------------------------------------------------
  API  : Delete All of chat
  router.delete('/deleteAllOfChat', MeetingContollder.deleteAllOfChat);
--------------------------------------------------`);
	console.log('[[deleteAllOfChat meetingId]] >>>>>> ', req.query._id)

	const dbModels = global.DB_MODELS;

	try {

        if (!req.query._id) {
            return res.status(400).send('invalid meeting id1');
        }

        const criteria = {
            meetingId: req.query._id,
        }

        // meetingId에 해당하는 모든 채팅들 query
        const deleteChat = await dbModels.MeetingChat.find(criteria);

		// console.log(deleteChat)

        if (!deleteChat) {
            return res.status(400).send('invalid meeting chat');
        }

        
		// DB에 업로드 된 모든 채팅들 삭제
		await dbModels.MeetingChat.deleteMany(criteria);
        
		return res.status(200).send({
			message: 'deleted All'
		})

    } catch (err) {
        console.log(err);
        res.status(500).send('internal server error');
    }

}


/*
	Get a role
*/
exports.getParticipantState = async (req, res) => {
	console.log(`
--------------------------------------------------
  API  : Get a role
  router.get('/getParticipantState', MeetingContollder.getParticipantState);
--------------------------------------------------`);
	console.log('[[getParticipantState]] >>>>>> ', req.query.meetingId)

	const dbModels = global.DB_MODELS;

	try {
		const criteria = {
			_id: req.query.meetingId,
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


/*
	Get a onLine
*/
exports.getOnlineTrue = async (req, res) => {
	console.log(`
--------------------------------------------------
  API  : Get a role
  router.get('/getOnlineTrue', MeetingContollder.getOnlineTrue);
--------------------------------------------------`);
	// console.log('[[getOnlineTrue]] >>>>>> ', req.query)

	/**
	 * req.query = {
	 * 	 meetingId: '61dfc310f3aedb66a1786e8e',
  		 userId: '61d3f9c13b83fffca344bf58'
	 * }
	 */
	const dbModels = global.DB_MODELS;

	try {
		
		const getOnlineTrue = await dbModels.Meeting.findOneAndUpdate(
			{
				_id: req.query.meetingId, // meetingId
				'currentMembers.member_id' : req.query.userId, // userId
			},
			{
				$set: {
					'currentMembers.$.online' : true
				}
			},
			{
				new: true
			}
		)
		// console.log('[[ getOnlineTrue ]]', getOnlineTrue)
		console.log('-------------------------------------------')

	
		if (!getOnlineTrue) {
            return res.status(400).send('invalid meeting online');
        }

		return res.status(200).send(
			getOnlineTrue
		)

	} catch (err) {

		return res.status(500).send({
			message: 'get a meeting role had an error'
		});

	}

}

/*
	Get a onLine
*/
exports.getOnlineFalse = async (req, res) => {
	console.log(`
--------------------------------------------------
  API  : Get a role
  router.get('/getOnlineFalse', MeetingContollder.getOnlineFalse);
--------------------------------------------------`);
	// console.log('[[getOnlineFalse]] >>>>>> ', req.query)

	const dbModels = global.DB_MODELS;

	try {
		
		// meetingId를 이용하여 field 찾고 찾은 field에서 값 수정
		// $는 배열의 몇 번째인지 index와 같은 역할
		const getOnlineFalse = await dbModels.Meeting.findOneAndUpdate(
			{
				_id: req.query.meetingId, // meetingId
				'currentMembers.member_id' : req.query.userId, // userId
			},
			{
				$set: {
					'currentMembers.$.online' : false
				}
			},
			{
				new: true
			}
		)
		// console.log('[[ getOnlineFalse ]]', getOnlineFalse)

	
		if (!getOnlineFalse) {
            return res.status(400).send('invalid meeting online');
        }

		return res.status(200).send(
			getOnlineFalse
		)

	} catch (err) {

		return res.status(500).send({
			message: 'get a meeting role had an error'
		});

	}

}



/*
	Update a Role
*/
exports.getRoleUpdate = async (req, res) => {
	console.log(`
--------------------------------------------------
  API  : Get a role
  router.get('/getRoleUpdate', MeetingContollder.getRoleUpdate);
--------------------------------------------------`);
	console.log('[[getRoleUpdate]] >>>>>> ', req.query)

	const dbModels = global.DB_MODELS;

	try {
		
		// meetingId를 이용하여 field 찾고 찾은 field에서 값 수정
		// $는 배열의 몇 번째인지 index와 같은 역할
		const getRoleUpdate = await dbModels.Meeting.findOneAndUpdate(
			{
				_id: req.query.meetingId, // meetingId
				'currentMembers.member_id' : req.query.userId, // userId
			},
			{
				$set: {
					'currentMembers.$.role' : req.query.role
				}
			},
			{
				new: true
			}
		)
		// console.log('[[ getRoleUpdate ]]', getRoleUpdate)
	
		if (!getRoleUpdate) {
            return res.status(400).send('invalid meeting online');
        }

		return res.status(200).send(
			getRoleUpdate
		)

	} catch (err) {

		return res.status(500).send({
			message: 'get a meeting role had an error'
		});

	}

}


/*
	Update a meeting status
*/
exports.getMeetingStatus = async (req, res) => {
	console.log(`
--------------------------------------------------
  API  : Get a meeting status
  router.get('/getMeetingStatus', MeetingContollder.getMeetingStatus);
--------------------------------------------------`);
	// console.log('[[getMeetingStatus]] >>>>>> ', req.query)

	const dbModels = global.DB_MODELS;

	try {

		const criteria = {
			_id: req.query.meetingId,
		}
		
		// meetingId를 이용하여 status 값 확인
		const getMeetingStatus = await dbModels.Meeting.findOne(criteria).select('status');
		// console.log('[[ getMeetingStatus ]]', getMeetingStatus)
	
		if (!getMeetingStatus) {
            return res.status(400).send('invalid getMeetingStatus');
        }

		const getStatus = {
			_id : getMeetingStatus._id,
			status : getMeetingStatus.status
		}

		return res.status(200).send(getStatus)

	} catch (err) {

		return res.status(500).send({
			message: 'get a getMeetingStatushad an error'
		});

	}

}