const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/mongo');
const path = require('path');
const cors = require('cors');
const sensorRoutes = require('./routes/sensorRoutes');
const mlRoutes = require('./routes/mlRoutes');
const farmerRoutes = require('./routes/farmerRoutes');

dotenv.config();
connectDB();

const helpRoutes = require("./routes/helpRoutes");
const blogRoutes = require('./routes/blogRoutes');
const app = express();

app.use(cors({
    origin:  ["https://agri1-frontend.onrender.com",, "http://localhost:5173"],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/blogs', blogRoutes);
app.use("/api/help", helpRoutes);
app.use('/api', require('./routes/sensorRoutes'));
app.use('/api/ml', require('./routes/mlRoutes'));
app.use('/api/images', require('./routes/imageRoutes'));
app.use('/api/farmer', farmerRoutes);

app.get('/', (req, res) => res.send('API Running'));

module.exports = app;
