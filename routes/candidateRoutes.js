const express = require('express')
const router = express.Router()
const User = require('../models/user')
const { jwtAuthMiddleWare, generateToken } = require('../jwt')
const Candidate = require('../models/candidate')


const checkAdminRole = async (userID) => {
    try {
        const user = await User.findById(userID);
        if (user.role === 'admin') {
            return true;
        }
    } catch (err) {
        return false;
    }
}

//POST route to add a candidate
router.post('/', jwtAuthMiddleWare, async (req, res) => {

    try {
        if (!(await checkAdminRole(req.user.id)))
            return res.status(403).json({ message: "user does not have admin role" })

        const data = req.body //asumming the request body contains User data

        //create new User document using mongose model
        const newCandidate = new Candidate(data)

        //save the new User to the database
        const response = await newCandidate.save();
        console.log('data saved');
        res.status(200).json({ response: response })

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' })
    }
})


//Update Candidate router

router.put('/:candidateID', jwtAuthMiddleWare, async (req, res) => {
    try {
        if (!checkAdminRole(req.user.id))
            return res.status(403).json({ message: "user does not have admin role" })

        const candidateID = req.params.candidateID; //extract the id from url
        const updatedCandidateData = req.body; //updated data for person

        const response = await Candidate.findByIdAndUpdate(candidateID, updatedCandidateData, {
            new: true, //return the updated documents
            runValidators: true, //Run mongoose
        })

        if (!response) {
            return res.status(404).json({ error: 'candidate not found' });
        }
        console.log('candidate data updated');
        res.status(200).json(response);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' })
    }
})

//delete candidate
router.delete('/:candidateID', jwtAuthMiddleWare, async (req, res) => {
    try {
        if (!checkAdminRole(req.user.id))
            return res.status(403).json({ message: "user does not have admin role" })

        const candidateID = req.params.candidateID; //extract the id from url

        const response = await Candidate.findByIdAndDelete(candidateID)

        if (!response) {
            return res.status(404).json({ error: 'candidate not found' });
        }
        console.log('candidate deleted');
        res.status(200).json(response);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' })
    }
})

//Candidate List

router.get('/list', async (req, res) => {

    try {

        const candidates = await Candidate.find()

        // Map the candidates to only return their name and voteCount

        const candidateList = candidates.map((data) => {
            return {
                name: data.name,
                party: data.party
            }
        });

        return res.status(200).json(candidateList);

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal Server Error' });

    }

})

// for user voting
router.post('/vote/:candidateID', jwtAuthMiddleWare, async (req, res) => {
    // no admin can vote
    // user can only vote once

    candidateID = req.params.candidateID;
    userId = req.user.id;

    try {
        // Find the Candidate document with the specified candidateID
        const candidate = await Candidate.findById(candidateID);
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'user not found' });
        }
        if (user.role == 'admin') {
            return res.status(403).json({ message: 'admin is not allowed' });
        }
        if (user.isVoted) {
            return res.status(400).json({ message: 'You have already voted' });
        }

        // Update the Candidate document to record the vote
        candidate.votes.push({ user: userId })
        candidate.voteCount++;
        await candidate.save();

        // update the user document
        user.isVoted = true
        await user.save();

        return res.status(200).json({ message: 'Vote recorded successfully' });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// vote count 
router.get('/vote/count', async (req, res) => {
    try {
        // Find all candidates and sort them by voteCount in descending order
        const candidate = await Candidate.find().sort({ voteCount: 'desc' });

        // Map the candidates to only return their name and voteCount
        const voteRecord = candidate.map((data) => {
            return {
                party: data.party,
                count: data.voteCount
            }
        });

        return res.status(200).json(voteRecord);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router