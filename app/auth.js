const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const pool = require('./db');

// Configure Passport to use the LocalStrategy
passport.use(new LocalStrategy(
    async (username, password, done) => {
        try {
            const res = await pool.query('SELECT * FROM userinfo WHERE username = $1', [username]);
            if (res.rows.length === 0) {
                return done(null, false, { message: 'Incorrect username.' });
            }
            const user = res.rows[0];
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'Incorrect password.' });
            }
        } catch (err) {
            return done(err);
        }
    }
));

// Serialize user instance to the session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user instance from the session
passport.deserializeUser(async (id, done) => {
    try {
        const res = await pool.query('SELECT * FROM userinfo WHERE id = $1', [id]);
        if (res.rows.length > 0) {
            done(null, res.rows[0]);
        } else {
            done(new Error('User not found'));
        }
    } catch (err) {
        done(err);
    }
});

module.exports = passport;


