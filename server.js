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
    dueDate: { type: String},
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // Reference to the user
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

app.post('/validate-password', async (req, res) => {
    const { username, password } = req.body;
    console.log('Received username:', username);

    try {
        // Find the user by username
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Compare the provided password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            return res.status(200).json({ valid: true });
        } else {
            return res.status(401).json({ valid: false, error: 'Invalid password' });
        }
    } catch (error) {
        console.error('Error validating password:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/todos', async (req, res) => {
    const { title, description, dueDate, user } = req.body; 
    console.log("Received Todo Data:", req.body);

    try {
        const newTodo = new Todo({
            title,
            description,
            dueDate,
            user, 
        });

        await newTodo.save();
        res.status(201).json({ message: 'Todo created successfully', todo: newTodo });
    } catch (error) {
        console.error('Error creating todo:', error);
        res.status(500).json({ error: 'Failed to create todo' });
    }
});

app.delete('/todos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deletedTodo = await Todo.findByIdAndDelete(id);
        if (!deletedTodo) {
            return res.status(404).send({ error: 'Todo not found' });
        }
        res.status(200).send({ message: 'Todo deleted successfully' });
    } catch (error) {
        console.error('Error deleting todo:', error);
        res.status(500).send({ error: 'Failed to delete todo' });
    }
});


app.put('/todos/:id', async (req, res) => {

    const { id } = req.params;
    const { title, description, dueDate } = req.body;

    try{
        const updatedTodo = await Todo.findByIdAndUpdate(
            id,
            { title, description, dueDate },
            { new: true } // Return the updated document
        );

        if (!updatedTodo) {
            return res.status(404).send({ error: 'Todo not found' });
        }

        res.status(200).send({ message: 'Todo updated successfully', todo: updatedTodo });
    }
    catch(error){
        console.error('Error updating: ', error);
        res.status(500).send({error: 'Failure to edit todo'});
    }


})

app.put('/users/:id', async(req, res) => {

    const { id } = req.params;
    const { firstName, lastName, username, password } = req.body;

    try{
        const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { firstName, lastName, username, ...(hashedPassword && { password: hashedPassword }) },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).send({ error: 'User was not found' });
        }

        res.status(200).send({ message: 'User has updated successfully', user: updatedUser });
    }
    catch(error){
        console.error('Error updating user: ', error);
        res.status(500).send({error: 'failure to edit user'});
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
    const userId = req.query.user; 
    try {
        const todos = await Todo.find({ user: userId }); 
        res.json(todos);
    } catch (error) {
        res.status(500).send('Server Error');
    }
});




const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});