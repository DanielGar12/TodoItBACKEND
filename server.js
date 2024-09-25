const express = require('express')
const mongoose = require('mongoose');

const app = express();

const bcrypt = require('bcrypt');



mongoose.connect('mongodb://localhost:27017/mydatabase', {
    useNewUrlParser: true,
    useUnifiedTopology: true,

})

.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

app.use(express.json())

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});
const todoSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    dueDate: { type: Date, required: true}
});



const User = mongoose.model('User', userSchema);
const Todo = mongoose.model('Todo', todoSchema);


app.post('/users', async (req, res) => {
    const { firstName, lastName, username, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ firstName, lastName, username, password: hashedPassword });
        await newUser.save();
        res.status(201).send({ message: 'User created successfully', user: newUser });
    } catch (error) {
        console.error('Registration error:', error);
        if (error.code === 11000) {
            return res.status(400).send({ error: 'Username already exists' });
        }
        return res.status(500).send({ error: 'Failed to create user' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).send({ error: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send({ error: 'Invalid credentials' });
        }

        res.status(200).send({ message: 'Login successful', user });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send({ error: 'Failed to log in' });
    }
});

app.post('/todos', async (req, res) => {
    const {title, description, dueDate} = req.body;

    try{
        const newTodo = new Todo({
            title,
            description,
            dueDate,
        });

        await newTodo.save();
        res.status(201).json({ message: 'Todo created successfully', todo: newTodo });
    }
    catch(error){
        console.error('Error creating todo:', error);
        res.status(500).json({ error: 'Failed to create todo' });
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
app.get('/todos', async (req, res) => {
    try {
        const todos = await Todo.find();
        res.status(200).json(todos); // Make sure this sends back JSON
    } catch (error) {
        console.error('Error fetching todos:', error);
        res.status(500).json({ error: 'Failed to fetch todos' });
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});