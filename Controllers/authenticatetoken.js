const jwt = require('jsonwebtoken') ; 
const { usercollection } = require('../db');
let SECRET_KEY = process.env.SECRET_KEY;
const authenticateToken = async (req, res, next) => {
   
    let token = req.cookies.token;
    if (!token) {
        return res.status(401).json({"You are not logged in": token});
    }
    console.log("Authentication in progress...");

    jwt.verify(token, SECRET_KEY, (error, user) => {
        if (error) {
            console.log("JWT Error:", error);

            // If the token is expired
            if (error.name === "TokenExpiredError") {
                return res.status(498).json("Token expired, please login again.");
            }

            return res.status(401).json("Invalid token, please login again.");
        }
        req.user = user;
        next();
    });
};
 
const check_login = async (req,res)=>{  
    console.log("email",req.user.email);
    const query = { email: req.user.email }; 
    const options = { 
        projection: { _id: 0, name: 1, email: 1,phone:1 },
    } 
    let user ;
    try {
      user = await usercollection.findOne(query,options) ;
    } catch (error) {
        console.log("error while feteching user in checklogin api ",error);
    }
    res.status(200).send({ "message": user});
   
}
module.exports = {authenticateToken,check_login} ; 