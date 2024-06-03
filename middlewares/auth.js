const { verifyToken } = require('./libraries/token');


exports.isAuthenticated = (req, res, next) => {
    console.log(req.headers)
    // 토큰 취득
    const token = req.body.token || req.query.token || req.headers.authorization;

    // 토큰 미존재: 로그인하지 않은 사용자
    if (!token) {
        return res.status(403).send({ error: true, message: '토큰이 존재하지 않습니다' });
    }

    // Bearer 부분 추출
    const bearer = token.split(" ");
    const bearerToken = bearer[1];
    verifyToken(bearerToken).then(decoded => {
        req.decoded = decoded;
        next();
    }).catch(err => {
        console.log(err)
        console.log('verify token error!!');
        res.status(403).json({ error: true, message: err.message });
    });
}

/**
 * ['admin','manager','superManager','user']
 *  슈퍼 관리업체, 관리업체, 운영위원회, 이사진
 * @param {*} roles ['admin','manager','superManager','user']
 * @returns 
 */
exports.checkRole = (roles) => async (req, res, next) => {
    const { isAdmin, isManager, isSuperManager, _id, name } = req.decoded;

    // 역할에 따른 권한 매핑
    const userRoles = {
        user: !isAdmin && !isManager && !isSuperManager, // 유저
        admin: isAdmin && !isManager && !isSuperManager, // 운영위원회가 등록가능한 매니저 (어드민 포지션)
        superManager: isSuperManager, // 운영위원회
        manager: isManager // 관리자
    };

    // 요청된 역할 중 하나라도 현재 사용자의 권한과 일치하는지 확인
    const hasRole = roles.some(role => userRoles[role]);

    if (!hasRole) {
        console.log('-----------권한에러-------------')
        console.log('api:', req.baseUrl, ' api 접근권한 : ', roles)
        console.log('사용자 ID', _id, name)
        console.log('사용자 권한 : ', userRoles)
        return res.status(403).json({ message: "You don't have permission to access this resource" });
    }
    next();
};

