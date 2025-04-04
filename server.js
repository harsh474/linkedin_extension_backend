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
const {authenticateToken,check_login,editdetails} = require('./Controllers/authenticatetoken')
const {extractJobDetails} = require( './googleapi') ; 
const { usercollection } = require('./db');

let SECRET_KEY = process.env.SECRET_KEY; 
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = 'https://www.jobmailer.in';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const getCookieConfig = () => {
  return {
    httpOnly: true,
    secure: NODE_ENV == 'production', // Only send over HTTPS in production
    sameSite: 'none', // Required for cross-domain cookies
    maxAge: COOKIE_MAX_AGE,
    // domain: NODE_ENV === 'production' ? '.jobmailer.in' : 'localhost', // Use root domain in production
    path: '/'
  };
};

app.get('/',authenticateToken,async(req, res)  => { 
    let email = req.user.email
     const query = { email:email  };  
        let user ;
        user = await usercollection.findOne(query) 
    if(user.currentcount>=user.maxxcount){ 
        return res.status(410).json("You pack has expired, recharge Now")
    }
    let userMessage = req.body.message || "";   
    try {
        // const emailTemplate = await extractJobDetails(userMessage) ;   
        user = await usercollection.findOneAndUpdate(
            {email:email},
            { 
                $inc: { 
                    currentcount :1
                }
            } ,
            { upsert: true, returnDocument: "after" });
        
        return res.status(200).json(user); 
    } catch (error) {
       return res.status(400).json(`error while writing  email ${error}`)
    }
});

app.set('trust proxy', 1) // trust first proxy

app.post('/chatgpt', authenticateToken, async (req, res) => { 
    let email = req.user.email
    const query = { email:email  };  
       let user ;
       user = await usercollection.findOne(query) 
   if(user.currentcount>=user.maxxcount){ 
       return res.status(410).json("You pack has expired, recharge Now")
   }
   let userMessage = req.body.message || "";   
   try {
       const emailTemplate = await extractJobDetails(userMessage) ;   
       user = await usercollection.findOneAndUpdate(
           {email:email},
           { 
               $inc: { 
                   currentcount :1
               }
           } ,
           { upsert: true, returnDocument: "after" });
       
       return res.status(200).json(emailTemplate); 
   } catch (error) {
      return res.status(400).json(`error while writing  email ${error}`)
   }
});

app.post('/signupform', async (req, res) => {
    const data = req.body.formdata; 
    try { 
        let maxxcount = 10, currentcount = 0; 
        // Ensure usercollection is defined and connected
        const user = await usercollection.insertOne({ ...data, maxxcount, currentcount });

        res.status(201).json({ message: "Successfully saved user data", user });
    } catch (error) {
        console.error("Error while saving data:", error.message);
        res.status(500).json({ error: "Error while saving data", details: error.message });
    }
});



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
            return res.status(401).json({error: "Password is not correct" });
        }
        // Compare the hashed password with the password from the request


        //   const isMatch = await bcrypt.compare(pass, user.password);
        //   if (!isMatch) { 
        //     console.log("Invalid credentials")
        //     return res.status(403).json({ error: "Invalid credentials" });
        //   }

        // Create a JWT token 

        const token = jwt.sign({ email: user.email }, SECRET_KEY); 
        console.log(getCookieConfig()); 
        const options = getCookieConfig();
        res.cookie("token", token,options); 

        // Set the token as a cookie and send a successful response
        res.status(200).json({ message: "Successfully logged in", "token": token });

    } catch (error) { 
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get('/logout', async (req, res) => {
    // res.clearCookie("token", {
    //     httpOnly: true,
    //     secure: true,
    //     sameSite: "none",
    // }); 
    res.clearCookie('token', {
      ...getCookieConfig(),
      maxAge: 0 // Immediate expiry
    });
    
    res.status(200).send("User logout successfully");
})


app.route('/edit-details').put(editdetails);
app.route('/check-login').get(authenticateToken,check_login) ;
app.route('/create-order').post(createOrder);
app.route('/verify-payment').post(verifyPayment);
app.route('/payment').post(payment_collection) ;


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});



