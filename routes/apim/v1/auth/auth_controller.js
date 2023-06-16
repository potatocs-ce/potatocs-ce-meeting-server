const jwt = require('jsonwebtoken');
const member = require('../../../../models/member_schema');



/*-------------------------------------------------
	Sign In
-------------------------------------------------*/
exports.signIn = async (req, res) => {
	console.log(`
--------------------------------------------------  
  API  : SignIn
  router.post('signIn', authController.signIn) 
--------------------------------------------------`);
	console.log(req.body);

	try {

        const criteria = {
            email: req.body.email
        }

		const user = await member.findOne(criteria);

		if(!user) {
			// console.log('No Matched Account');
			return res.status(404).send({
				message: 'not found'
			});
		}

		if(user && user.retired == true){
			return res.status(400).send({
				message: `retired`
			});
		}

		const isMatched = await user.comparePassword(req.body.password, user.password);

		if(!isMatched) {
			// console.log('Password Mismatch');
			return res.status(404).send({ 
				message: 'mismatch'
			});
		}

		const payload = {
			_id: user._id,
			name: user.name
		};

		const jwtOption = {
			expiresIn: '1d'
		};

		const token = jwt.sign(payload, process.env.JWT_SECRET, jwtOption);
		
		const projection = {
			password: false,
			createdAt: false,
			updatedAt: false
		}

		/*------------------------------------------
			5. send token and profile info to client
		--------------------------------------------*/
		res.send({
			token
		});


	} catch (error) {
		console.log(error);
		return res.status(500).send('An error has occurred in the server');
	}
};