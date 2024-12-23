const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const mongoApp = {};
mongoApp.appSetObjectId = function (app) {
	app.set("ObjectId", mongoose.Types.ObjectId);
	console.log("complete to set mongoose ObjectId");
};

main().catch((err) => console.error(err));

async function main() {
	await mongoose
		.connect(process.env.MONGODB_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		})
		.then(() => {
			createSchema();
			console.log("Database Connected");
		});
}

function createSchema() {
	const dbModels = {};

	dbModels.VideoDrawing = require("../models/video_drawing");
	dbModels.DocDrawing = require("../models/doc_drawing");
	dbModels.Meeting = require("../models/meeting_schema");
	dbModels.Member = require("../models/member_schema");
	dbModels.MeetingChat = require("../models/meetingChat_schema");
	dbModels.Doc = require("../models/doc_schema");
	dbModels.Survey = require("../models/survey_schema");
	dbModels.Survey_Result = require("../models/survey_result_schema");

	global.DB_MODELS = dbModels;
}

module.exports = mongoApp;
