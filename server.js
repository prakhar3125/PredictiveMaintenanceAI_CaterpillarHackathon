const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// Create MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '312531', // Replace with your MySQL password
  database: 'signup' // Replace with your MySQL database name
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/untitled.html');
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Connected to the database as ID ' + db.threadId);
});

// Handle form submission for registration
app.post('/register', (req, res) => {
  const { name, lastName, email, password } = req.body;

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error('Error hashing password:', err);
      return res.status(500).send('Error processing your request.');
    }

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

// Handle login
app.post('/login', (req, res) => {
  const { Email, Password } = req.body;

  if (!Email || !Password) {
      return res.status(400).send('Both email and password are required.');
  }

  const sql = 'SELECT password FROM users WHERE email = ?';
  db.query(sql, [Email], (err, results) => {
      if (err) {
          console.error('Error querying the database:', err);
          return res.status(500).send('Error querying the database.');
      }

      if (results.length > 0) {
          const storedHash = results[0].password;

          bcrypt.compare(Password, storedHash, (err, isMatch) => {
              if (err) {
                  console.error('Error comparing passwords:', err);
                  return res.status(500).send('Error processing your request.');
              }

              if (isMatch) {
                  console.log(`Inserting into logs: ${Email}`);
                  const insertLogSql = 'INSERT INTO logs (emailid) VALUES (?)';
                  db.query(insertLogSql, [Email], (err) => {
                      if (err) {
                          console.error('Error inserting into logs:', err);
                          return res.status(500).send('Error processing your request.');
                      }

                      console.log('Insertion into logs successful.');
                      res.redirect('/index.html');
                  });
              } else {
                  res.status(401).send('Invalid email or password.');
              }
          });
      } else {
          res.status(401).send('Invalid email or password.');
      }
  });
});

// Handle form submission for data
app.post('/submit-form', (req, res) => {
  const { machine, Complaint_Type, component, value } = req.body;

  console.log('Form Data Received:', { machine, Complaint_Type, component, value });

  db.query('SELECT emailid FROM logs ORDER BY log_id DESC LIMIT 1', (err, logResult) => {
    if (err) {
      console.error('Error fetching logs:', err);
      return res.status(500).send('Server Error');
    }

    const tempMail = logResult[0].emailid;
    console.log('Most Recent Email:', tempMail);

    db.query('SELECT id FROM users WHERE email = ?', [tempMail], (err, userResult) => {
      if (err) {
        console.error('Error fetching user id:', err);
        return res.status(500).send('Server Error');
      }

      const id = userResult[0].id;
      console.log('Corresponding User ID:', id);

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

// Handle fetching machine data and saving to JSON file
app.post('/get-machine-data', async (req, res) => {
  const selectedMachine = req.body.machine;

  try {
    // Step 1: Get the most recent emailid from the logs table
    const [log] = await db.promise().query('SELECT emailid FROM logs ORDER BY log_id DESC LIMIT 1');
    const tempMail = log[0].emailid;

    // Step 2: Get the corresponding Id from the users table
    const [user] = await db.promise().query('SELECT id FROM users WHERE email = ?', [tempMail]);
    const fetchedId = user[0].id;

    // Step 3: Fetch the dataset based on the Id and selected machine, excluding the primary key
    const [dataset] = await db.promise().query('SELECT Id, Time, Machine, Component, Parameter, Value FROM dataset WHERE Id = ? AND Machine = ?', [fetchedId, selectedMachine]);

    // Step 4: Convert the dataset to JSON
    const jsonData = JSON.stringify(dataset, null, 2); // Pretty-print with 2 spaces

    // Step 5: Define the file path and save the JSON file to the hard disk
    const filePath = path.join(__dirname, 'machine_data.json');
    fs.writeFileSync(filePath, jsonData);

    // Send success response
    res.json({ message: 'Data saved to machine_data.json', filePath: filePath });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'An error occurred while fetching and saving the data.' });
  }
});


///js without saving json
// app.post('/get-machine-data', async (req, res) => {
//   const selectedMachine = req.body.machine;

//   // Step 1: Get the most recent emailid from the logs table
//   const [log] = await db.query('SELECT emailid FROM logs ORDER BY log_id DESC LIMIT 1');
//   const tempMail = log.emailid;

//   // Step 2: Get the corresponding Id from the users table
//   const [user] = await db.query('SELECT id FROM users WHERE email = ?', [tempMail]);
//   const fetchedId = user.id;

//   // Step 3: Fetch the dataset based on the Id and selected machine, excluding the primary key
//   const dataset = await db.query('SELECT Id, Time, Machine, Component, Parameter, Value FROM dataset WHERE Id = ? AND Machine = ?', [fetchedId, selectedMachine]);

//   // Convert the dataset to JSON and send it in the response
//   res.json(dataset);
// });
app.post('/process-complaint', (req, res) => {
  const { machine, vehicle_location, complaint_description, servicing_date } = req.body;

  console.log('Form Data Received:', { machine, vehicle_location, complaint_description, servicing_date });

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

      // Insert data into complaints table
      const sql = 'INSERT INTO complaints (Id, machine, vehicle_location, complaint_description, servicing_date) VALUES (?, ?, ?, ?, ?)';
      db.query(sql, [id, machine, vehicle_location, complaint_description, servicing_date], (err, insertResult) => {
        if (err) {
          console.error('Error inserting into complaints:', err);
          return res.status(500).send('Server Error');
        }

        console.log('Data successfully inserted into complaints:', {
          Id: id,
          machine: machine,
          vehicle_location: vehicle_location,
          complaint_description: complaint_description,
          servicing_date: servicing_date
        });

        res.send('Data successfully inserted into complaints');
      });
    });
  });
});


app.get('/past-complaints', (req, res) => {
  db.query('SELECT machine, complaint_description, servicing_date, vehicle_location, submission_date AS complaint_date FROM complaints', (err, results) => {
    if (err) {
      console.error('Error fetching complaints:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }

    // Convert date fields to a readable format
    results = results.map(complaint => ({
      ...complaint,
      complaint_date: new Date(complaint.complaint_date).toLocaleString(), // Convert to local date string
      servicing_date: new Date(complaint.servicing_date).toLocaleDateString(), // Convert to local date string
    }));

    res.json(results);
  });
});





// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
