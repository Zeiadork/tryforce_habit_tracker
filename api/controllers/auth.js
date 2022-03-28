const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();


async function register (req, res) 
{
    try 
    {
        console.log("Now creating user at controller");
        const salt = await bcrypt.genSalt();
        const hashed = await bcrypt.hash(req.body.password, salt);
        console.log("Pass salted and hashed")
        const user = await User.create( {...req.body, password : hashed, salt: salt });
        res.status(201).json(user);
    } 
    catch (err) 
    {
        res.status(422).json({err});
    }
}


async function login (req,res)
{
    let user;

    console.log("Attempting to login with : " +req.body.name + " p: " +req.body.password);

    try
    {
        console.log("Finding now...")
        user = await User.getByName(req.body.name);
        console.log(user);
        if (user)
        {
            console.log("Found user on name: " + user.name);
        }
        else if (!user)
        {
            console.log("couldn't find user with name: " +req.body.name);
            user = await User.getByEmail(req.body.name);
            console.log("Found user on email: " + user.name);
        }
        else if (!user)
        {
            console.log("couldn't find user with email: " +req.body.name);
            throw new Error ('Login error - invalid details');
        }
        else
        {
            console.log('Login error - invalid details');
            res.status(401).json({err});
        }
        
        let salt = user.salt;

        console.log("Salt to check: "+ salt);

        const hashed = await bcrypt.hash(req.body.password, salt);
        
        const authed = await bcrypt.compare(hashed, user.password);

        console.log("authed? " + authed)

        if (!!authed)
        {
            console.log("Auth success, logging in")
            const payload = { name: user.name, email: user.email};
            const sendToken = (err, token) =>
            {
                if (err) {throw new Error ('Token Generation failed')}
                console.log("sending token");
                res.status(200).json({ success:true,  token: "Bearer " + token})
            }
            
            jwt.sign(payload, process.env.TOKENKEY, {expiresIn : 3600}, sendToken);
        }
        else
        {
            throw new Error ('User auth failed - controller');
        }       
    }
    catch (err)
    {
        console.log("somnething went wrong..");
        res.status(401).json({err});
    }

}


module.exports = { register, login };