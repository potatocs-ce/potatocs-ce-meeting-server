const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const member_Schema = mongoose.Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
		},
		password: {
			type: String,
			required: true,
			trim: true,
		},
		name: {
			type: String,
			required: true,
		},
		profile_img: {
			type: String,
			default: "",
		},
		mobile: {
			type: String,
			default: "",
		},
		department: {
			type: String,
			default: "",
		},
		isManager: {
			type: Boolean,
			default: false,
		},
		position: {
			type: String,
			default: "",
		},
		annual_leave: {
			type: Number,
			default: 0,
		},
		sick_leave: {
			type: Number,
			default: 0,
		},
		replacementday_leave: {
			type: Number,
			default: 0,
		},
		location: {
			type: String,
			default: "",
		},
		emp_start_date: {
			type: Date,
			default: null,
		},
		emp_end_date: {
			type: Date,
			default: null,
		},
	},
	{
		timestamps: true,
	}
);
// member_Schema가 저장되기 전에(pre 'save' 이벤트) 실행되는 미들웨어 정의
member_Schema.pre("save", function (next) {
	// 현재 사용자 객체를 user 변수에 할당
	var user = this;

	// bcrypt를 사용하여 솔트(salt)를 생성 (작업 비용(cost factor) 10)
	bcrypt.genSalt(10, function (err, salt) {
		// 에러 발생 시 다음 미들웨어로 에러 전달
		if (err) return next(err);

		// 생성된 솔트를 사용하여 사용자 비밀번호를 해시 처리
		bcrypt.hash(user.password, salt, function (err, hash) {
			// 에러 발생 시 다음 미들웨어로 에러 전달
			if (err) return next(err);
			// 해시된 비밀번호를 사용자 객체에 저장
			user.password = hash;
			// 다음 미들웨어로 이동하여 저장 프로세스 계속 진행
			next();
		});
	});
});

// member_Schema의 메서드 comparePassword 정의
// 사용자가 입력한 비밀번호와 저장된 해시 값(암호화된 비밀번호)을 비교하는 함수
member_Schema.methods.comparePassword = function (password, hash) {
	return new Promise((resolve, reject) => {
		// bcrypt.compare를 사용하여 입력한 비밀번호와 해시 값 비교
		bcrypt.compare(password, hash, (err, result) => {
			// 에러가 발생하면 Promise를 reject로 처리
			if (err) reject(err);
			// 비교 결과가 성공적이면 Promise를 resolve로 처리
			else resolve(result);
		});
	});
};

const Member = mongoose.model("Member", member_Schema);

module.exports = Member;
