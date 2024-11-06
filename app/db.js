let { Pool } = require('pg');
let env = require('../env.json');

let pool = new Pool(env);

pool.connect()
  .then(() => {
    console.log('Connected to database');
  })
  .catch(err => {
    console.error('Database connection error:', err.stack);
  });

module.exports = pool;

