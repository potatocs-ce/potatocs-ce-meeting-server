// es5 문법으로 사용
const express = require('express');

// express 정의
const app = express();
const cors = require('cors')
// https 
const https = require('httpolyglot')
// mediasoup 불러오기
const fs = require('fs')
const path = require('path')
const config = require('./config')

const { Server } = require("socket.io");

const options = {
    key: fs.readFileSync(path.join(__dirname, config.sslKey), 'utf-8'),
    cert: fs.readFileSync(path.join(__dirname, config.sslCrt), 'utf-8')
}



const allowedOrigins = ['http://localhost:4200', 'https://localhost:4200','http://localhost:4202','https://localhost:4202', 'http://localhost:4300', 'http://192.168.0.5:4200', 'http://192.168.0.5:4300', 'http://192.168.0.42:4200', 'http://192.168.0.42:4300', 'https://buildingtalks.com', 'https://test-potatocs-lb.com', 'http://test-potatocs-lb.com'];

app.use(cors({
    origin: allowedOrigins,
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* -----------------------------------------
    npm run test 
    npm run prod
----------------------------------------- */
if (process.env.NODE_ENV.trim() == 'production') {
    require('dotenv').config({ path: path.join(__dirname, '/env/prod.env') });
} else if (process.env.NODE_ENV.trim() == 'development') {
    require('dotenv').config({ path: path.join(__dirname, '/env/dev.env') });
}

app.use('/room/apim/v1', require('./routes/apim/v1'));
/* -----------------------------------------
    DB
----------------------------------------- */
const mongApp = require('./database/mongoDB');


const httpsServer = https.createServer(options, app)
httpsServer.listen(3300, '0.0.0.0', () => {
    console.log('Listening on https://' + config.listenIp + ':' + config.listenPort)

    /*----------------------------------
    CONNECT TO MONGODB SERVER
------------------------------------*/
    mongApp.appSetObjectId(app);
})
// 소켓

const io = new Server(httpsServer, {
    cors: {
        origin: "*",
        credentials: true,
    },
    path: '/socket/'
})



const socket_mediasoup = require('./webRTC/mediasoup.js');
const socket_drawing = require('./webRTC/drawing.js');
const socket_chat = require('./webRTC/chat.js');
const socket_survey = require('./webRTC/survey.js');
const socket_doc = require('./webRTC/doc.js');

io.on('connection', (socket) => {
    socket_mediasoup(io, socket, app);
    socket_drawing(io, socket, app);
    socket_chat(io, socket, app);
    socket_survey(io, socket, app);
    socket_doc(io, socket, app);
})

/*
  localhost:3000/meeting/meetingId
  와 같이
  app.use('/', 와 다른 경로 일 경우
  여기로 받은 후 angular로 보낸다.  
*/
/*---------------------------------------------------------
    서버상에 존재하지 않는 주소를 넣는 경우에 대한 처리
        - angular route의 path로 바로 이동하는 경우
   여기를 통해서 진입.
  --> 나중에 처리. : nginx 등을 이용하는 경우 다르게 처리...
-------------------------------------------------------------*/
// app.use(function (req, res) {
//     console.log(`
//     ============================================
//       >>>>>> Invalid Request! <<<<<<
    
//       Req: "${req.url}"
//         => Redirect to 'index.html'
//     ============================================`)
//     res.sendFile(__dirname + './dist/angular_mediasoup2/browser');
// });