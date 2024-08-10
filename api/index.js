const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');  // Ensure bcrypt is included
const app = express();
const port = 3000;
const moment = require('moment'); // For handling current time
require('dotenv').config(); // Load environment variables from .env file

// Create MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Connected to the database as ID ' + db.threadId);
});

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (like your HTML form)
app.use(express.static('public'));

// Handle form submission for registration
app.post('/register', (req, res) => {
  const { name, lastName, email, password } = req.body;

  // Hash the password before storing
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error('Error hashing password:', err);
      return res.status(500).send('Error processing your request.');
    }

    // Insert data into the database
    const sql = "INSERT INTO users (name, last_name, email, password) VALUES (?, ?, ?, ?)";
    const values = [name, lastName, email, hashedPassword];

    db.query(sql, values, (err, results) => {
      if (err) {
        console.error('Error inserting data:', err);
        res.status(500).send('Oops! Something went wrong while submitting the form.');
      } else {
        res.status(200).send('Thank you! Your registration has been successful!');
      }
    });
  });
});



//
app.post('/login', (req, res) => {
  const { Email, Password } = req.body;

  // Validate input
  if (!Email || !Password) {
      return res.status(400).send('Both email and password are required.');
  }

  // Query the database for the user
  const sql = 'SELECT password FROM users WHERE email = ?';
  db.query(sql, [Email], (err, results) => {
      if (err) {
          console.error('Error querying the database:', err);
          return res.status(500).send('Error querying the database.');
      }

      if (results.length > 0) {
          const storedHash = results[0].password;

          // Compare provided password with stored hash
          bcrypt.compare(Password, storedHash, (err, isMatch) => {
              if (err) {
                  console.error('Error comparing passwords:', err);
                  return res.status(500).send('Error processing your request.');
              }

              if (isMatch) {
                  // Successful login, insert into logs table
                  console.log(`Inserting into logs: ${Email}`);
                  const insertLogSql = 'INSERT INTO logs (emailid) VALUES (?)';
                  db.query(insertLogSql, [Email], (err) => {
                      if (err) {
                          console.error('Error inserting into logs:', err);
                          return res.status(500).send('Error processing your request.');
                      }

                      console.log('Insertion into logs successful.');
                      // Redirect to index.html
                      res.redirect('/index.html');
                  });
              } else {
                  // Incorrect password
                  res.status(401).send('Invalid email or password.');
              }
          });
      } else {
          // Email not found
          res.status(401).send('Invalid email or password.');
      }
  });
});
///
app.post('/submit-form', (req, res) => {
  const { machine, Complaint_Type, component, value } = req.body;

  console.log('Form Data Received:', { machine, Complaint_Type, component, value });

  // Get the most recent email from logs
  db.query('SELECT emailid FROM logs ORDER BY log_id DESC LIMIT 1', (err, logResult) => {
    if (err) {
      console.error('Error fetching logs:', err);
      return res.status(500).send('Server Error');
    }

    const tempMail = logResult[0].emailid;
    console.log('Most Recent Email:', tempMail);

    // Get the corresponding id from users
    db.query('SELECT id FROM users WHERE email = ?', [tempMail], (err, userResult) => {
      if (err) {
        console.error('Error fetching user id:', err);
        return res.status(500).send('Server Error');
      }

      const id = userResult[0].id;
      console.log('Corresponding User ID:', id);

      // Insert data into dataset
      const sql = 'INSERT INTO dataset (Id, Time, Machine, Component, Parameter, Value) VALUES (?, NOW(), ?, ?, ?, ?)';
      db.query(sql, [id, machine, Complaint_Type, component, value], (err, insertResult) => {
        if (err) {
          console.error('Error inserting into dataset:', err);
          return res.status(500).send('Server Error');
        }

        console.log('Data successfully inserted into dataset:', {
          Id: id,
          Time: new Date(),
          Machine: machine,
          Component: Complaint_Type,
          Parameter: component,
          Value: value
        });

        res.send('Data successfully inserted into dataset');
      });
    });
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
