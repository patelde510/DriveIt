// server.js

let express = require("express");
let app = express();
let port = 8080;
let hostname = '0.0.0.0';
let { v4: uuidv4 } = require("uuid");
let bcrypt = require("bcrypt");
let pool = require('./db');
let cookieParser = require("cookie-parser");

app.use(express.static(__dirname));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


let cookieOptions = {
    httpOnly: true, // Prevents JavaScript access
    secure: false, // Set to true if using HTTPS
    sameSite: "strict", // Cookie sent only to this domain
};

app.post("/signup", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).send("Username and password are required.");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const result = await pool.query("SELECT * FROM CUSTOMER WHERE username = $1", [username]);
        if (result.rows.length > 0) {
            return res.status(400).send("Username is already taken.");
        }
        // Insert user into the database
        await pool.query("INSERT INTO CUSTOMER (username, password) VALUES ($1, $2)", [
            username,
            hashedPassword,
        ]);
        res.send("Signup successful. Please log in.");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error signing up. Username might already be taken.");
    }
});

// Login route
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).send("Username and password are required.");
    }

    try {
        // Check if the user exists
        const result = await pool.query("SELECT * FROM CUSTOMER WHERE username = $1", [username]);
        const user = result.rows[0];

        if (user && (await bcrypt.compare(password, user.password))) {
            // Generate a unique session ID
            const sessionId = uuidv4();
            res.cookie("session_id", sessionId, cookieOptions);
            res.send("Login successful!");
            res.redirect("/")
        } else {
            res.status(401).send("Invalid username or password.");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Error logging in.");
    }
});

function checkIfLoggedIn(req, res, next) {
    if (req.cookies.session_id) {
        return res.redirect("/"); // Redirect to homepage if logged in
    }
    next(); // Continue to the next middleware if not logged in
}

// Logout route
app.get("/logout", (req, res) => {
    res.clearCookie("session_id", cookieOptions);
    res.send("Logout successful.");
});

// Serve the signup, login, and logout HTML pages
app.get("/signup", checkIfLoggedIn, (req, res) => {
    res.sendFile(__dirname + "/public/signup.html");
});

app.get("/login", checkIfLoggedIn, (req, res) => {
    res.sendFile(__dirname + "/public/login.html");
});

app.get("/logout", (req, res) => {
    res.sendFile(__dirname + "/public/logout.html");
});

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

app.listen(port, hostname, () => {
    console.log(`http://${hostname}:${port}`);
});
