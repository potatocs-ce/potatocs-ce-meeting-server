const { ObjectId } = require('bson');


/* 
	Create a folder
*/
exports.createFolder = async (req, res) => {
	console.log(`
--------------------------------------------------
	User : ${req.decoded._id}
	API  : Create a folder
	router.get('/create-folder', sideNavContollder.createFolder);

	folder_name : ${req.body.folder_name}
--------------------------------------------------`);

	const dbModels = global.DB_MODELS;

	try {

		const criteria = {
			member_id: req.decoded._id,
			displayName: req.body.folder_name
		}
		
		const newFolder = dbModels.Folder(criteria);

		await newFolder.save();

		return res.status(200).send({
			message: 'created'
		})

	} catch (err) {

		return res.status(500).send({
			message: 'An error has occurred'
		});

	}

}


/*
	Create a spce
*/
exports.createSpace = async (req, res) => {
	console.log(`
--------------------------------------------------
	User : ${req.decoded._id}
	API  : Create a folder
	router.get('/create-space', sideNavContollder.createSpace);

	spaceName : ${req.body.spaceName}
	spaceBrief : ${req.body.spaceBrief}
--------------------------------------------------`);

	const dbModels = global.DB_MODELS;
	let timeDigit = new Date().getTime().toString();
	timeDigit = timeDigit.slice(9, 13);

	try {

		const criteria = {
			displayName: req.body.spaceName,
			displayBrief: req.body.spaceBrief,
			spaceTime: new Date().getMilliseconds().toString() + timeDigit,
			members: [
				req.decoded._id
			],
			admins: [
				req.decoded._id
			]
		}

		const Space = dbModels.Space(criteria);

		await Space.save();

		return res.status(200).send({
			message: 'created'
		})

	} catch (err) {

		return res.status(500).send({
			message: 'creatintg a space had an error'
		});

	}

}

exports.updateSpace = async (req, res) => {

	console.log(`
--------------------------------------------------
  User : ${req.decoded._id}
  API  : Get my Space
  router.get(/load-update-menu', sideNavContollder.updateSpace);
--------------------------------------------------`);
	const dbModels = global.DB_MODELS;

	try {
		console.log(dbModels.Space)
		const spaceNav = await dbModels.Space.aggregate([
			{
				$match: {
					members: ObjectId(req.decoded._id)
				}
			}
		]);
		console.log(spaceNav)
		return res.status(200).send({
			message: 'updated',
			spaceNav,
		
		})
		

	} catch (err) {

		console.log('[ ERROR ]', err);
		res.status(500).send({
			message: 'loadUpateMenu Error'
		})
	}

}