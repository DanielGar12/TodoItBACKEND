const express = require('express')
const mongoose = require('mongoose');

const app = express();



mongoose.connect('mongodb://localhost:27017/mydatabase', {
    useNewUrlParser: true,
    useUnifiedTopology: true,

})

.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

app.use(express.json())

const userSchema =  new mongoose.Schema({
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true},
})

const User = mongoose.model('User', userSchema);

app.post('/users', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const newUser = new User({ username, password });
        await newUser.save();
        res.status(201).send({ message: 'User created successfully', user: newUser });
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).send({ error: 'Username already exists' });
        } else {
            res.status(500).send({ error: 'Failed to create user' });
        }
    }
});


app.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).send(users);
    } catch (error) {
        res.status(500).send({ error: 'Failed to fetch users' });
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});