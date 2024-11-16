let express = require("express");
let app = express();
let hostname;
let port = 8080;

let { Pool } = require('pg');

let databaseConfig;
if (process.env.NODE_ENV == "production") {
    hostname = "0.0.0.0";
    databaseConfig = { connectionString: process.env.DATABASE_URL };
} else {
    hostname = "localhost";
    databaseConfig = require('../env.json');
}

let { v4: uuidv4 } = require("uuid");
let bcrypt = require("bcrypt");
let pool = new Pool(databaseConfig);
pool.connect().then(() => {
    console.log("Connected to database");
})
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
    const { username, password, name, address, city, state, country, email } = req.body;
    if (!username || !password || !name || !address || !city || !state || !country || !email) {
        return res.status(400).send("Username and password are required.");
    }

    // Validation
    if (username.length < 3 || username.length > 20) {
        return res.status(400).send("Username must be between 3 and 20 characters.");
    }
    if (password.length < 8) {
        return res.status(400).send("Password must be at least 8 characters long.");
    }
    if (!/^[a-zA-Z ]+$/.test(name)) {
        return res.status(400).send("Name must contain only letters and spaces.");
    }
    if (!/^[\w\s,.-]+$/.test(address)) {
        return res.status(400).send("Address contains invalid characters.");
    }
    if (!/^[a-zA-Z ]+$/.test(city)) {
        return res.status(400).send("City must contain only letters and spaces.");
    }
    if (!/^[A-Z]{2}$/.test(state)) {
        return res.status(400).send("State must be a 2-letter abbreviation.");
    }
    if (!/^[a-zA-Z]+$/.test(country)) {
        return res.status(400).send("Country must contain only letters.");
    }
    if (!/^[\w-.]+@[a-zA-Z\d-]+\.[a-z]{2,}$/.test(email)) {
        return res.status(400).send("Invalid email format.");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const result = await pool.query("SELECT * FROM CUSTOMER WHERE username = $1", [username]);
        if (result.rows.length > 0) {
            return res.status(400).send("Username is already taken.");
        }
        // Insert user into the database
        await pool.query("INSERT INTO CUSTOMER (username, password, name, address, city, state, country, email) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)", [
            username, hashedPassword, name, address, city, state, country, email
        ]);
        return res.send("Signup successful. Please log in.");
    } catch (err) {
        console.error(err);
        return res.status(500).send("Error signing up. Username might already be taken.");
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

            // Insert the session ID into the database
            await pool.query("UPDATE CUSTOMER SET sessionId = $1 WHERE username = $2", [sessionId, username]);

            return res.send("Login successful!");
        } else {
            return res.status(401).send("Invalid username or password.");
        }
    } catch (err) {
        console.error(err);
        return res.status(500).send("Error logging in.");
    }
});

function checkIfLoggedIn(req, res, next) {
    if (!req.cookies.session_id) {
        return res.redirect("/login");
    }
    // If the session_id exists, continue to the next route handler
    next();
}

function redirectIfLoggedIn(req, res, next) {
    if (req.cookies.session_id) {
        return res.redirect("/");
    }
    next(); // Proceed to the login route if not logged in
}

// Serve the signup, login, and logout HTML pages
app.get("/signup", redirectIfLoggedIn, (req, res) => {
    return res.sendFile(__dirname + "/public/signup.html");
});

app.get("/checkSession", async (req, res) => {
    const sessionId = req.cookies.session_id;
    if (!sessionId) {
        return res.status(401).send("Not logged in.");
    }

    try {
        // Retrieve user based on session ID
        const result = await pool.query("SELECT username FROM CUSTOMER WHERE sessionId = $1", [sessionId]);
        const user = result.rows[0];

        if (user) {
            return res.status(200).send(`Check successful, logged in as ${user.username}`);
        } else {
            return res.status(401).send("Session not found. Please log in again.");
        }
    } catch (err) {
        console.error(err);
        return res.status(500).send("Error checking login status.");
    }
});

app.get("/login", redirectIfLoggedIn, (req, res) => {
    return res.sendFile(__dirname + "/public/login.html");
});

// Logout route
app.get("/logout", (req, res) => {
    res.clearCookie("session_id", cookieOptions);
    return res.redirect("/");
});

app.get("/buy", (req, res) => {
    res.sendFile(__dirname + "/public/buy.html")
})

app.get("/sell", (req, res) => {
    res.sendFile(__dirname + "/public/sell.html")
})

app.get("/", (req, res) => {
    return res.sendFile(__dirname + "/public/index.html");
});

app.listen(port, hostname, () => {
    console.log(`http://${hostname}:${port}`);
});
