const jwt = require("jsonwebtoken");
const member = require("../../../../models/member_schema");

/*-------------------------------------------------
    Sign In
-------------------------------------------------*/
exports.signIn = async (req, res) => {
	console.log(`
--------------------------------------------------  
  API  : SignIn
  router.post('signIn', authController.signIn) 
--------------------------------------------------`);

	try {
		const criteria = {
			email: req.body.email,
		};

		const user = await member.findOne(criteria);

		if (!user) {
			// console.log("No Matched Account");
			return res.status(404).json({
				message: "not found",
			});
		}

		if (user && user.retired == true) {
			return res.status(400).send({
				message: `retired`,
			});
		}

		const isMatched = await user.comparePassword(req.body.password, user.password);

		if (!isMatched) {
			// console.log('Password Mismatch');
			return res.status(404).send({
				message: "mismatch",
			});
		}

		const payload = {
			_id: user._id,
			name: user.name,
		};

		const jwtOption = {
			expiresIn: "1d",
		};

		const token = jwt.sign(payload, process.env.JWT_SECRET, jwtOption);

		const projection = {
			password: false,
			createdAt: false,
			updatedAt: false,
		};

		/*------------------------------------------
            5. send token and profile info to client
        --------------------------------------------*/
		res.send({
			token,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).send("An error has occurred in the server");
	}
};

exports.getUserInfo = async (req, res) => {
	console.log(`
    --------------------------------------------------
      User : 
      API  : Get my UserData
      router.get(/getUserData', meetingContollder.getUserData);
    ---------------------------------------------------`);
	const dbModels = global.DB_MODELS;
	const criteria = {
		_id: req.params.userId,
	};

	try {
		const userData = await dbModels.Member.findOne(criteria);
		// console.log('[[ getuserData ]]', userData)
		console.log("-------------------------------------------");

		if (!userData) {
			// console.log('No Matched Account');
			return res.status(404).send({
				message: "not found",
			});
		}

		return res.send({
			userData: userData,
		});
	} catch (err) {
		console.log("[ ERROR ]", err);
		res.status(500).send("getuserData Error");
	}
};
