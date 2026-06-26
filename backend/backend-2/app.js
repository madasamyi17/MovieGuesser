const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/auth.routes');
const movieRoutes = require('./routes/movie.routes');
const leaderboardRoutes = require('./routes/leaderboard.routes');

const app = express();

const allowedOrigins = [
    "http://localhost:5173",
    "https://movieguesserr.web.app"
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no Origin (Postman, curl, server-to-server)
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        callback(new Error("Not allowed by CORS"));
    },
    credentials: true
}));

// app.use(cors({
//     origin: "https://movieguesserr.web.app",
//     credentials: true
// }))

// app.use(cors({
//     origin: "http://localhost:5173",
//     credentials: true
// }));


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());


app.use('/', authRoutes);
app.use('/api', movieRoutes);
app.use('/api', leaderboardRoutes);

module.exports = app;
