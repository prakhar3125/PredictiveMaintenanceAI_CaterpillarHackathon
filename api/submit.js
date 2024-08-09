const supabase = require('../supabaseClient');

module.exports = async (req, res) => {
  console.log('Submit route hit'); // Add this line
    const { name, registration_number, block_room_number, email, Complaint_Type, message } = req.body;

    console.log('Form data received:', { name, registration_number, block_room_number, email, Complaint_Type, message });

    try {
        const { data, error } = await supabase
            .from('prakhar')
            .insert([{ 
                name, 
                registration_number, 
                block_room_number, 
                email, 
                complaint_type: Complaint_Type,
                message 
            }]);

        if (error) {
            console.error('Supabase insert error:', error.message);
            res.status(500).send('Error submitting your complaint');
            return;
        }

        console.log('Data successfully inserted:', data);
        res.status(200).send('Thank you! Your submission has been received!');
    } catch (err) {
        console.error('Unexpected error:', err.message);
        res.status(500).send('Unexpected error submitting your complaint');
    }
};
