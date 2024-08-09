const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // Ensure you have a 'public' folder for static files

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '312531',
    database: 'complaints'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database');
});

app.post('/submit', (req, res) => {
    const { name, registration_number, block_room_number, email, Complaint_Type, message } = req.body;

    const sql = 'INSERT INTO complaints (name, registration_number, block_room_number, email, Complaint_Type, message) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [name, registration_number, block_room_number, email, Complaint_Type, message], (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            res.status(500).send('Error submitting your complaint');
            return;
        }
        res.status(200).send('Thank you! Your submission has been received!');
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});