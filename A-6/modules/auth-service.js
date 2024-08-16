const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config(); // Load environment variables from .env file

// Define the user schema
const userSchema = new mongoose.Schema({
    userName: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    loginHistory: [
        {
            dateTime: { type: Date, default: Date.now },
            userAgent: { type: String }
        }
    ]
});

let User;

// Initialize function to connect to MongoDB and define the User model
function initialize() {
    return new Promise((resolve, reject) => {
        mongoose.connect(process.env.MONGODB, { useNewUrlParser: true, useUnifiedTopology: true })
            .then(() => {
                User = mongoose.model('User', userSchema);
                resolve();
            })
            .catch((err) => {
                reject('Error connecting to MongoDB: ' + err);
            });
    });
}

// Register a new user
function registerUser(userData) {
    return new Promise((resolve, reject) => {
        if (!userData.userName || !userData.password || !userData.email) {
            return reject(new Error('Please fill all required fields.'));
        } else if (userData.password !== userData.password2) {
            return reject(new Error('Passwords do not match.'));
        } else {
            bcrypt.hash(userData.password, 10, (err, hashedPassword) => {
                if (err) return reject('Error hashing password: ' + err);
                
                const newUser = new User({
                    userName: userData.userName.toLowerCase(), // Convert to lowercase for consistency
                    password: hashedPassword,
                    email: userData.email,
                    loginHistory: []
                });

                newUser.save()
                    .then(() => resolve())
                    .catch((err) => {
                        if (err.code === 11000) { // Duplicate key error
                            reject(new Error('User already exists.'));
                        } else {
                            reject(new Error('Error creating user: ' + err));
                        }
                    });
            });
        }
    });
}

// Check user credentials
function checkUser(userData) {
    return new Promise((resolve, reject) => {
        User.findOne({ userName: userData.userName.toLowerCase() })
            .then((user) => {
                if (!user) {
                    return reject('Unable to find user: ' + userData.userName);
                }

                // Compare passwords
                bcrypt.compare(userData.password, user.password)
                    .then((isMatch) => {
                        if (!isMatch) {
                            return reject('Incorrect Password for user: ' + userData.userName);
                        }

                        // Update login history
                        if (user.loginHistory.length === 8) {
                            user.loginHistory.pop();
                        }

                        user.loginHistory.unshift({
                            dateTime: new Date(),
                            userAgent: userData.userAgent
                        });

                        user.save()
                            .then(() => resolve(user))
                            .catch((err) => reject('There was an error updating the login history: ' + err));
                    })
                    .catch((err) => reject('Error comparing passwords: ' + err));
            })
            .catch((err) => reject('Unable to find user: ' + userData.userName));
    });
}

module.exports = { initialize, registerUser, checkUser };
