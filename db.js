const mongoose = require('mongoose');
require('dotenv').config()

// MongoDB URL
//  local URL
const mongoURL = process.env.MONGODB_URL_LOCAL;
// const mongoURL = process.env.MONGODB_URL;

// Setup MongoDB connection
mongoose.connect(mongoURL);

// Mongoose maintain default connection object representing the MongoDB connection
const db = mongoose.connection;

// Event listeners for Database connection
db.on('connected', () => {
    console.log('Connected to MongoDB server');
});

db.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

db.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

module.exports = db;
