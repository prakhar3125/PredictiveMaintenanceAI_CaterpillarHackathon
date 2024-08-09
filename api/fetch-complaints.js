const supabase = require('../supabaseClient');

module.exports = async (req, res) => {
    const { registration_number, email } = req.body;

    try {
        const { data, error } = await supabase
            .from('prakhar')
            .select('name, complaint_type, message, created_at')
            .eq('registration_number', registration_number)
            .eq('email', email);

        if (error) {
            console.error('Error fetching data from Supabase:', error);
            res.status(500).json({ error: 'Error fetching data' });
            return;
        }

        res.json(data);
    } catch (error) {
        console.error('Error in the server route:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
};
