const jwt = require('jsonwebtoken')

const jwtAuthMiddleWare = (req, res, next)=>{

    //first check request headers has authorization or not
    const authorization = req.headers.authorization
    if(!authorization) return res.status(401).json({error: 'Token not found'})

    //extract the jwt token from the request headers
    const token = req.headers.authorization.split(' ')[1]
    if(!token) return res.status(401).json({error: 'unauthorized'});
    try{
        //verify the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        //Attach user information to the request object
        req.user = decoded
        next();
    }catch(err){
        console.error(err);
        res.status(401).json({error: 'Invalid token'});

    }
}

//Function to generate jwt token
const generateToken = (userData) =>{
    //generate a new JWT token using user Data
    return jwt.sign(userData, process.env.JWT_SECRET, {expiresIn: 300000000000})
}

module.exports = {jwtAuthMiddleWare, generateToken}