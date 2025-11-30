import dotenv from 'dotenv';
dotenv.config();

import connectDB from './db/index.js';
import app from './app.js';

const PORT = process.env.PORT || 5000;

// Define routes before starting the server
app.get('/', (req, res) => {
    res.send('API is running...');
}); 

app.post('/name', (req, res) => {
    const name = req.body.name;
    res.send(`Hello, ${name}!`);
});

app.post('/age', (req, res) => {
    const age = req.body.age;
    res.send(`You are ${age} years old!`);
});

connectDB()
.then(() => {
    console.log('Database connected successfully');
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})
.catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
});