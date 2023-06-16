const { ObjectId } = require('bson');

exports.getSpace = async (req, res) => {

	console.log(`
--------------------------------------------------
  User : ${req.decoded._id}
  API  : Get my Space
  router.get(/space/:spaceTime', spaceController.getSpace);
  Params: ${req.params.spaceTime}
--------------------------------------------------`);
	const dbModels = global.DB_MODELS;

	try {
	
		// console.log(spaceNav);
		// https://crmrelease.tistory.com/131 파이프라인
		const spaceMembers = await dbModels.Space.aggregate([
			{
				$match: {
					$expr: {
						$eq: ['$spaceTime', req.params.spaceTime]
					}
				}
			},
			{
				$addFields: {
					isAdmin: {
						$cond: [
							{ $in: [ObjectId(req.decoded._id), '$admins'] },
							true,
							false,
						]
					},
				}
			},
			{
				$lookup: {
					from: 'members',
					let: {
						memberArray: '$members'
					},
					pipeline: [
						{
							$match: {
								$expr: {
									$in: ['$_id', '$$memberArray']
								}
							}
						},
						{
							$project: {
								email: 1,
								name: 1,
								profile_img: 1
							}
						}
					],
					as: 'memberObjects'
				}
			},
			{
				$project: {
					displayName: 1,
					displayBrief: 1,
					spaceTime: 1,
					isAdmin: 1,
					memberObjects: 1,
					admins: 1
				}
			}
			
		]);

		console.log(spaceMembers)

		return res.status(200).send({
			message: 'getSpace',
			spaceMembers,
		
		})
		

	} catch (err) {

		console.log('[ ERROR ]', err);
		res.status(500).send({
			message: 'loadUpateMenu Error'
		})
	}

}