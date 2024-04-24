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


app.use(express.static(path.join(__dirname, './dist/angular_mediasoup2/browser')))

const allowedOrigins = ['http://localhost:4200', 'http://localhost:4300', 'http://192.168.0.5:4200', 'http://192.168.0.5:4300', 'http://192.168.0.42:4200', 'http://192.168.0.42:4300', 'https://buildingtalks.com'];

app.use(cors({
    origin: allowedOrigins,
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/apim/v1', require('./routes/apim/v1'));

/* -----------------------------------------
    npm run test 
    npm run prod
----------------------------------------- */
if (process.env.NODE_ENV.trim() == 'production') {
    require('dotenv').config({ path: path.join(__dirname, '/env/prod.env') });
} else if (process.env.NODE_ENV.trim() == 'development') {
    require('dotenv').config({ path: path.join(__dirname, '/env/dev.env') });
}


/* -----------------------------------------
    DB
----------------------------------------- */
const mongApp = require('./database/mongoDB');


const httpsServer = https.createServer(options, app)
httpsServer.listen(3000, '0.0.0.0', () => {
    console.log('Listening on https://' + config.listenIp + ':' + config.listenPort)

    /*----------------------------------
    CONNECT TO MONGODB SERVER
------------------------------------*/
    mongApp.appSetObjectId(app);
})
// 소켓

const io = new Server(httpsServer, {
    cors: {
        origin: "*"
    },
    path: '/socket/'
})



const socket_mediasoup = require('./webRTC/mediasoup.js');
const socket_drawing = require('./webRTC/drawing.js');

io.on('connection', (socket) => {
    socket_mediasoup(io, socket, app);
    socket_drawing(io, socket, app);
})

