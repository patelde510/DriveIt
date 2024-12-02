let express = require("express");
let fetch = require("node-fetch");
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
    httpOnly: true,
    secure: false,
    sameSite: "strict",
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

app.get("/get-vehicle-options", async (req, res) => {
    try {
        const result = await pool.query("SELECT vin, make, model, yearofmanufacture FROM vehicle");
        const vehicles = result.rows.map(vehicle => ({
            vin: vehicle.vin,
            make: vehicle.make,
            model: vehicle.model,
            yearOfManufacture: vehicle.yearofmanufacture
        }));
        return res.status(200).json(vehicles);
    } catch (err) {
        console.error("Error fetching vehicle options:", err);
        return res.status(500).send("Error fetching vehicle options");
    }
});

app.post("/compare", async (req, res) => {
    const { vehicles } = req.body;
    try {
        const vehicleResult = await pool.query(
            "SELECT * FROM vehicle WHERE vin = ANY($1::text[])",
            [vehicles]
        );

        const specsResult = await pool.query(
            "SELECT * FROM specs WHERE vin = ANY($1::text[])",
            [vehicles]
        );

        const specsMap = {};
        specsResult.rows.forEach(spec => {
            specsMap[spec.vin] = spec;
        });

        const formattedData = vehicleResult.rows.map(vehicle => ({
            vin: vehicle.vin,
            make: vehicle.make,
            model: vehicle.model,
            yearOfManufacture: vehicle.yearofmanufacture,
            price: vehicle.price,
            bodyType: vehicle.bodytype,
            driveTrain: vehicle.drivetrain,
            mileage: vehicle.mileage,
            condition: vehicle.condition,
            status: vehicle.status,
            specs: specsMap[vehicle.vin] || null
        }));

        return res.status(200).json({ vehicleData: formattedData });
    } catch (error) {
        console.error("Error during comparison:", error);
        return res.status(500).json({ error: "An error occurred while processing vehicles." });
    }
});

app.get("/fetch-api-for-buy", async (req, res) => {
    try {
        const fs = require('fs');
        const envConfig = JSON.parse(fs.readFileSync('env.json', 'utf8'));
        const apiKey = envConfig.api_key;
        let apiURL = `https://mc-api.marketcheck.com/v2/search/car/active?api_key=${apiKey}&include_relevant_links=true&radius=50`;

        // Extract filters from query params
        const { make, model, yearofmanufacture, condition } = req.query;

        if (make) {
            apiURL += `&make=${make}`;
        }

        if (model) {
            apiURL += `&model=${model}`;
        }

        if (condition) {
            apiURL += `&car_type=${condition.toLowerCase()}`;
        }

        if (yearofmanufacture) {
            apiURL += `&year=${yearofmanufacture}`;
        }

        const apiResponse = await fetch(apiURL);
        const data = await apiResponse.json();



        for (const listing of data.listings) {
            const vin = listing.vin;
            const make = listing.build?.make;
            const model = listing.build?.model;
            const year = listing.build?.year;
            const price = listing.price;
            const mileage = listing.miles;
            const bodyType = listing.build?.body_type;
            const drivetrain = listing.build?.drivetrain;
            const condition = listing.inventory_type;
            const status = listing.status || "active";
            const imageUrl = listing.media?.photo_links?.[0] || null;


            if (vin && make && model && year && price && mileage && bodyType && drivetrain && condition) {
                await pool.query(
                    `INSERT INTO Vehicle (vin, make, model, bodytype, drivetrain, price, mileage, condition, yearofmanufacture, status, image_url)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                    [vin, make, model, bodyType, drivetrain, price, mileage, condition, year, status, imageUrl]
                );

                const exteriorColor = listing.exterior_color;
                const interiorColor = listing.interior_color;
                const engineType = listing.build?.engine;
                const numSeats = listing.build?.std_seating;
                const transmission = listing.build?.transmission;
                const fuelType = listing.build?.fuel_type;

                if (vin && exteriorColor && interiorColor && engineType && numSeats && transmission && fuelType) {
                    await pool.query(
                        `INSERT INTO Specs (vin, exteriorcolor, interiorcolor, enginetype, numberofseats, transmission, fueltype)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                        [vin, exteriorColor, interiorColor, engineType, numSeats, transmission, fuelType]
                    );
                }
            }
        }

        res.status(200).send("Data successfully fetched and inserted into the database");
    } catch (error) {
        console.error("Error fetching or inserting data:", error);
        res.status(500).send("Error fetching or inserting data");
    }
});

app.get("/get-vehicles", async (req, res) => {
    try {
        const { make, model, yearofmanufacture, condition } = req.query;
        let query = `
            SELECT v.*, 
                   s.exteriorcolor, 
                   s.interiorcolor, 
                   s.enginetype, 
                   s.numberofseats, 
                   s.transmission, 
                   s.fueltype
            FROM vehicle v
            LEFT JOIN specs s ON v.vin = s.vin
        `;
        const queryParams = [];
        const conditions = [];
        let queryNum = 1;

        if (make) {
            conditions.push(`LOWER(v.make) = $${queryNum}`);
            queryParams.push(make.toLowerCase());
            queryNum++;
        }

        if (model) {
            conditions.push(`LOWER(v.model) = $${queryNum}`);
            queryParams.push(model.toLowerCase());
            queryNum++;
        }

        if (condition) {
            conditions.push(`v.condition = $${queryNum}`);
            queryParams.push(condition.toLowerCase());
            queryNum++;
        }

        if (yearofmanufacture) {
            conditions.push(`v.yearofmanufacture = $${queryNum}`);
            queryParams.push(yearofmanufacture);
            queryNum++;
        }

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(" AND ")}`;
        }

        const result = await pool.query(query, queryParams);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Error fetching vehicles from the database:", err);
        res.status(500).send("Error fetching vehicles");
    }
});




app.get("/buy", (req, res) => {
    res.sendFile(__dirname + "/public/buy.html");
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

app.get("/compare", (req, res) => {
    res.sendFile(__dirname + "/public/compare.html");
})


// Add to favorites
app.post("/add-to-favorites", async (req, res) => {
    const { vin } = req.body;
    const sessionId = req.cookies.session_id;

    if (!sessionId) {
        return res.status(401).send("You must log in to add vehicles to favorites.");
    }

    try {
        const customerResult = await pool.query(
            "SELECT custid FROM CUSTOMER WHERE sessionId = $1",
            [sessionId]
        );

        if (customerResult.rows.length === 0) {
            return res.status(401).send("Unauthorized user. Please log in to add to favorites.");
        }

        const custId = customerResult.rows[0].custid;

        const favoriteCheck = await pool.query(
            "SELECT * FROM FAVORITES WHERE custid = $1 AND vin = $2",
            [custId, vin]
        );

        if (favoriteCheck.rows.length > 0) {
            return res.status(200).send("Vehicle is already in favorites.");
        }

        await pool.query(
            "INSERT INTO FAVORITES (custid, vin) VALUES ($1, $2)",
            [custId, vin]
        );

        return res.status(200).send("Vehicle added to favorites.");
    } catch (err) {
        console.error("Error adding to favorites:", err);
        return res.status(500).send("Error adding to favorites.");
    }
});

app.get("/get-favorites", checkIfLoggedIn, async (req, res) => {
    const sessionId = req.cookies.session_id;

    if (!sessionId) {
        return res.status(401).send("Unauthorized user.");
    }

    try {
        // Fetch customer based on session ID
        const customerResult = await pool.query(
            "SELECT custid FROM CUSTOMER WHERE sessionId = $1",
            [sessionId]
        );

        if (customerResult.rows.length === 0) {
            return res.status(401).send("Unauthorized user.");
        }

        const custId = customerResult.rows[0].custid;

        const favoritesResult = await pool.query(
            `SELECT v.vin, v.make, v.model, v.bodytype, v.price, v.yearofmanufacture, 
                    v.mileage, v.condition, v.status, v.image_url, 
                    v.drivetrain, s.exteriorcolor, s.interiorcolor, 
                    s.enginetype, s.numberofseats, s.transmission, s.fueltype
             FROM FAVORITES f 
             JOIN VEHICLE v ON f.vin = v.vin 
             LEFT JOIN SPECS s ON v.vin = s.vin
             WHERE f.custid = $1`,
            [custId]
        );

        return res.status(200).json(favoritesResult.rows);
    } catch (err) {
        console.error("Error fetching favorites:", err);
        return res.status(500).send("Error fetching favorites.");
    }
});


// Remove from favorites
app.post("/remove-from-favorites", async (req, res) => {
    const { vin } = req.body;
    const sessionId = req.cookies.session_id;

    if (!sessionId) {
        return res.status(401).send("Unauthorized. Please log in.");
    }

    try {
        const customerResult = await pool.query(
            "SELECT custid FROM CUSTOMER WHERE sessionId = $1",
            [sessionId]
        );

        if (customerResult.rows.length === 0) {
            return res.status(401).send("Unauthorized user.");
        }

        const custId = customerResult.rows[0].custid;

        const deleteResult = await pool.query(
            "DELETE FROM FAVORITES WHERE custid = $1 AND vin = $2",
            [custId, vin]
        );

        if (deleteResult.rowCount === 0) {
            return res.status(404).send("Vehicle not found in favorites.");
        }

        return res.status(200).send({ message: "Vehicle successfully removed from favorites." });
    } catch (err) {
        console.error("Error removing vehicle from favorites:", err);
        return res.status(500).send("Error removing vehicle from favorites.");
    }
});

app.get("/get-reviews", async (req, res) => {
    const { vin } = req.query;

    if (!vin) {
        return res.status(400).send("Vehicle VIN is required.");
    }

    try {
        const reviewsResult = await pool.query(
            "SELECT comments, make, model FROM review WHERE vin = $1",
            [vin]
        );

        res.status(200).json(reviewsResult.rows);
    } catch (err) {
        console.error("Error fetching reviews:", err);
        res.status(500).send("Error fetching reviews.");
    }
});

app.post("/submit-review", async (req, res) => {
    try {
        const { vin, comment } = req.body;
        const sessionId = req.cookies.session_id;

        if (!sessionId) {
            return res
                .status(401)
                .send("You must log in to submit a review.");
        }

        if (!vin || !comment) {
            return res
                .status(400)
                .send("VIN and comment are required to submit a review.");
        }

        const userResult = await pool.query(
            "SELECT custid FROM CUSTOMER WHERE sessionId = $1",
            [sessionId]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).send("Invalid session. Please log in again.");
        }

        const custId = userResult.rows[0].custid;

        const vehicleResult = await pool.query(
            "SELECT make, model FROM vehicle WHERE vin = $1",
            [vin]
        );

        if (vehicleResult.rows.length === 0) {
            return res
                .status(400)
                .send("Vehicle not found for the provided VIN.");
        }

        const { make, model } = vehicleResult.rows[0];

        await pool.query(
            `INSERT INTO review (vin, custid, comments, make, model) VALUES ($1, $2, $3, $4, $5)`,
            [vin, custId, comment, make, model]
        );

        res.status(200).send("Review submitted successfully.");
    } catch (err) {
        console.error("Error submitting review:", err);
        res.status(500).send("Error submitting review.");
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


app.get("/", (req, res) => {
    return res.sendFile(__dirname + "/public/index.html");
});

app.get("/favorites", checkIfLoggedIn, (req, res) => {
    res.sendFile(__dirname + "/public/favorites.html");
});

app.get("/review", (req, res) => {
    res.sendFile(__dirname + "/public/review.html");
});

app.listen(port, hostname, () => {
    console.log(`http://${hostname}:${port}`);
});
