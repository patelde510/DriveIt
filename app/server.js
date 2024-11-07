// server.js

let express = require("express");
let app = express();
let session = require('express-session');
let port = 3000;
let hostname = "localhost";
let pool = require('./db');
let passport = require('./auth');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize session middleware
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

// Initialize Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Signup route
app.post("/signup", async (req, res) => {
    const { username, password } = req.body;

    try {
        // Hash the password using bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new user into the database
        await pool.query('INSERT INTO userinfo (username, password) VALUES ($1, $2)', [username, hashedPassword]);
        res.status(201).send('User registered successfully');
    } catch (err) {
        console.error('Error during signup:', err.stack);
        res.status(500).send('Error registering user');
    }
});

// Login route
app.post("/login", passport.authenticate('local', {
    successRedirect: '/profile',
    failureRedirect: '/login-failure',
    failureFlash: false
}));

// Route for handling login failure
app.get("/login-failure", (req, res) => {
    res.status(401).send('Invalid username or password');
});

// Logout route
app.get("/logout", (req, res) => {
    req.logout(err => {
        if (err) {
            return res.status(500).send('Error during logout');
        }
        res.send('Logged out successfully');
    });
});

// Protected route example
app.get("/profile", (req, res) => {
    if (req.isAuthenticated()) {
        res.send(`Hello, ${req.user.username}`);
    } else {
        res.status(401).send('You need to log in to access this page');
    }
});


app.get("/", (req, res) => {
    res.send('Hello World!\n Testing for Autodeploy');
  })

app.listen(port, hostname, () => {
    console.log(`http://${hostname}:${port}`);
});
