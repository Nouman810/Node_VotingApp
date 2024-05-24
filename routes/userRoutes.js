const express = require('express')
const router = express.Router()
const User = require('./../models/user')
const { jwtAuthMiddleWare, generateToken } = require('./../jwt')

//POST route to add a person
router.post('/signup', async (req, res) => {

    try {
        const data = req.body //asumming the request body contains User data

        // Check if there is already an admin user
        const adminUser = await User.findOne({ role: "admin" })
        if (data.role === 'admin' && adminUser != null) {
            return res.status(400).json({ error: "admin already exist" })
        }

        //validate CNIC number
        if (!/^\d{11}$/.test(data.CNIC)) {
            return res.status(401).json({ error: "CNIC number must be 11 digits without dashes" })
        }

        //check if same CNIC already exists
        const existingUser = await User.findOne({ CNIC: data.CNIC })
        if (existingUser) {
            return res.status(400).json({ error: 'User with the same CNIC Number already exists' });

        }

        //create new User document using mongose model
        const newUser = new User(data)

        //save the new User to the database
        const response = await newUser.save();
        console.log('data saved');

        const payload = {
            id: response.id,
        }

        console.log(JSON.stringify(payload));
        const token = generateToken(payload)
        console.log("Token is : ", token);
        res.status(200).json({ response: response, token: token })

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' })
    }
})

//Login Route
router.post('/login', async (req, res) => {
    try {

        //extract CNIC and password from the request body
        const { CNIC, password } = req.body

        //find the user by CNIC
        const user = await User.findOne({ CNIC: CNIC });

        //If CNIC does not exist or password does not match
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: "invalid CNIC or password" })
        }

        //generate token
        const payload = {
            id: user.id,
        }
        const token = generateToken(payload)
        //return token as response
        res.json({ token })
    }
    catch (err) {
        console.error(err)
        res.status(500).json({ error: 'internal server error' })
    }
})

//profile route
router.get('/profile/password', jwtAuthMiddleWare, async (req, res) => {
    try {
        const userData = req.user;
        const userId = userData.id;
        const user = await Person.findById(userId)

        res.status(200).json({ user })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'internal server error' })

    }
})



//Update person router

router.put('/profile/password', async (req, res) => {
    try {
        const userId = req.user //extract the id from token
        const { currentPassword, newPassword } = req.body //extract current and new password  from request body

        //find the user by userID
        const user = await User.findById(userId);

        //if password does not match, return error
        if (!(await user.comparePassword(currentPassword))) {
            return res.status(401).json({ error: 'Invalid Username or password' })
        }

        //update the user's password
        user.password = newPassword
        await user.save();

        console.log('Password updated');
        res.status(200).json({ message: 'password updated' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' })
    }
})



module.exports = router