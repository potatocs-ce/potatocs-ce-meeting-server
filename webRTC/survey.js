const { ObjectId } = require("mongodb");

module.exports = function (io, socket, app) {
	socket.on("updateSurveyList", async ({ _id, userId }, callback) => {
		const dbModels = global.DB_MODELS;

		const surveys = await dbModels.Survey.aggregate([
			{
				$match: { meetingId: new ObjectId(_id) },
			},
			{
				$lookup: {
					from: "survey_results",
					localField: "_id",
					foreignField: "survey_id",
					as: "results",
				},
			},
			{
				$project: {
					_id: 1,
					title: 1,
					description: 1,
					createdAt: 1,
					userId: 1,
					participated: {
						$anyElementTrue: {
							$map: {
								input: "$results",
								as: "result",
								in: { $eq: ["$$result.user_id", new ObjectId(userId)] },
							},
						},
					},
				},
			},
		]);

		socket.to(_id).emit("updateSurveyList", surveys);

		callback(surveys);
	});
};
