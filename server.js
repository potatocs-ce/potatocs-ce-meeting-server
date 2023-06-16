const SocketIO = require("socket.io");
const path = require('path')
const express = require('express');
const http = require('http');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.urlencoded({extended: true}));
app.use(express.json());

/* -----------------------------------------
    npm run test 
    npm run prod
----------------------------------------- */ 
if(process.env.NODE_ENV.trim() == 'production') {
  require('dotenv').config({ path: path.join(__dirname, '/env/prod.env') });
} else if(process.env.NODE_ENV.trim() == 'development') {
  require('dotenv').config({ path: path.join(__dirname, '/env/dev.env') });
}

/* -----------------------------------------
    PORT
----------------------------------------- */ 
var port = normalizePort(process.env.PORT);
app.set('port', port);

/* -----------------------------------------
    DB
----------------------------------------- */ 
const mongApp = require('./database/mongoDB');

/* -----------------------------------------
    AWS
----------------------------------------- */ 
const AWS = require('aws-sdk');
const fs = require("fs");

/* -----------------------------------------
    S3 CONFIG
----------------------------------------- */ 
// AWS.config.loadFromPath('./config/S3config.json');
const s3 = new AWS.S3({
	accessKeyId: process.env.AWS_ACCESS_KEY,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	region: process.env.AWS_REGION
});

global.AWS_S3 = {
	s3,
	bucket: process.env.AWS_S3_BUCKET
};

const config = require('./config/config');

// const options = {
//     //key: fs.readFileSync('./../../../../etc/letsencrypt/live/pingppung.xyz/privkey.pem'),
//     //cert: fs.readFileSync('./../../../../etc/letsencrypt/live/pingppung.xyz/cert.pem')
//     key: fs.readFileSync(__dirname + '/private.pem'),
//     cert: fs.readFileSync(__dirname + '/public.pem')
// };



// [API] Routers
app.use('/apim/v1', require('./routes/apim/v1'));
// app.post('/deleteMeetingPdfFile', (req, res) => {
//     console.log('[[[[ deleteMeetingPdfFile ]]]]', req.body._id)

//     app.use('/apim/v1/whiteBoard/deleteMeetingPdfFile/', { params: req.body._id })
 
// })

// test

/*
  angular 빌드 한 후 나온 dist 파일을 여기로 옮긴다.
  그리고 dist 파일에 index.html 파일이 angular 파일이 된다.
  그리고 app.use('/', express.static(path.join(__dirname, '/client'))); 바라보면
  angnular 페이지가 작동된다. 
*/
// static
app.use('/', express.static(path.join(__dirname, '/client')));


process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";





// 로컬에서 https 적용시 사용
// const httpServer = http.createServer(options, app).listen(app.get('port'), () => {
const httpServer = http.createServer(app).listen(app.get('port'), () => {
    console.log(` 
    +---------------------------------------------+
    |                                                 
    |      [ Potatocs Server ]
    |
    |      - Version:`,process.env.VERSION,`        
    |
    |      - Mode: ${process.env.MODE}
    |                                      
    |      - Server is running on port ${app.get('port')}
    |
    +---------------------------------------------+
    `);

    /*----------------------------------
        CONNECT TO MONGODB SERVER
    ------------------------------------*/
    mongApp.appSetObjectId(app);
});

const wsServer = SocketIO(httpServer,  {
    path: '/socketWebRTC'
});


function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}


/*
 * Management of WebSocket messages
 */

const Rooms = [];
const RoomNumClient = [];

function RoomList(data) {
    const meeting_info = {
        meeting_master : data.meeting_master,
        meeting_name : data.meeting_name,
        meeting_date : data.meeting_date,
        meeting_time : data.meeting_time,
        meeting_num :  RoomNumClient[data.meeting_name],
    }
    Rooms.push(meeting_info);
    return Rooms;
}


/*---------------------------
	Namespace
----------------------------*/
const socketWebRTC = wsServer.of('/socketWebRTC');



/*-----------------------------------------------
    webRTC Socket event handler
-----------------------------------------------*/
const sharing = require('./controllers/webRTC/socketHandler-sharing.js')
const drawing = require('./controllers/whiteBoard/socketHandler-drawing.js')
const meetingChat = require('./controllers/webRTC/socketHandler-chat')

socketWebRTC.on('connection', (socket) => {
    sharing(wsServer, socket, app )
    drawing(wsServer, socket, app)
    meetingChat(wsServer, socket, app)
});


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
app.use(function(req, res) {
    console.log(`
    ============================================
      >>>>>> Invalid Request! <<<<<<
    
      Req: "${req.url}"
        => Redirect to 'index.html'
    ============================================`)
     res.sendFile(__dirname+'/client/index.html');
});