const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const cors = require('cors');
const jwt = require('jsonwebtoken')
const bcrypt = require("bcryptjs")
const cookieParser = require('cookie-parser')
dotenv.config();  // Load environment variables
const { json } = require("stream/consumers");
const app = express();
const PORT = process.env.PORT || 3001;
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: ['http://localhost:3000', 'chrome-extension://mggcnpciocmgadnfpkooinmkgikobmoi'],
    credentials: true,            //access-control-allow-credentials:true
    optionSuccessStatus: 200
}));
const {createOrder,verifyPayment} = require('./Controllers/razorpayController') ;
const {payment_collection} = require('./Controllers/payment') ; 
const {authenticateToken,check_login} = require('./Controllers/authenticatetoken')
const {extractJobDetails} = require( './googleapi') ; 
const { usercollection } = require('./db');

let SECRET_KEY = process.env.SECRET_KEY;
app.get('/', (req, res) => {
    res.send("Hello World");
});

app.set('trust proxy', 1) // trust first proxy




app.post('/chatgpt', authenticateToken, async (req, res) => {
  
    let userMessage = req.body.message || "";  
    const emailTemplate = await extractJobDetails(userMessage) ;   

    return res.status(200).json(emailTemplate); 

});


app.post('/signupform', async (req, res) => {
    const data = req.body.formdata;
    try {
        const result = await usercollection.insertOne(data);
        res.send("sucessfuly save user data")
    } catch (error) {
        console.error("Error while saving data", error.response ? error.response.data : error.message)
        res.status(500).json({ "error while saving data": error })
    }
})


app.post('/login', async (req, res) => {
    try {

        const { email, pass } = req.body;
        if (req.cookies.token) {

            return res.status(200).json({ "message": "User is already login" });
        }
        // Find the user by email
        const user = await usercollection.findOne({ email: email });

        if (!user) {
            return res.status(404).json({ error: "You are not registered, kindly register." });
        }
        if (user.password !== pass) {
            return res.status(401).json({ error: "Password is not correct" });
        }
        // Compare the hashed password with the password from the request


        //   const isMatch = await bcrypt.compare(pass, user.password);
        //   if (!isMatch) { 
        //     console.log("Invalid credentials")
        //     return res.status(403).json({ error: "Invalid credentials" });
        //   }

        // Create a JWT token
        const token = jwt.sign({ email: user.email }, SECRET_KEY);
        // res.cookie("token", token, {
        //     httpOnly: true,  // Prevents client-side access to the cookie
        //     secure: true,    // Ensures the cookie is only sent over HTTPS
        //     sameSite: "none",// Required for cross-origin cookies
        //     domain: "linkdinextensionbackend-dzc7dterc9cggrhd.eastus-01.azurewebsites.net"

        // }); 
        res.cookie("token",token) ;
        // Set the token as a cookie and send a successful response
        res.status(200).json({ message: "Successfully logged in", "token": token });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get('/logout', async (req, res) => {
    res.clearCookie('token');
    res.status(200).send("User logout successfully");
});




app.route('/check-login').get(authenticateToken,check_login) ;
app.route('/create-order').post(createOrder);
app.route('/verify-payment').post(verifyPayment);
app.route('/payment').post(payment_collection) ;


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});



