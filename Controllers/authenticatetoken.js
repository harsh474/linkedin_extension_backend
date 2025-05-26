const jwt = require('jsonwebtoken') ; 
const { usercollection, redis_client } = require('../db');
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
    let user_email = req.user.email ;
    const query = { email: req.user.email }; 
    let user ;
    try {  
      let cached = await redis_client.get(user_email) ; 
      user = cached? JSON.parse(cached) :await usercollection.findOne(query) ;  
      redis_client.set(user_email,JSON.stringify(user));
      res.status(200).json({ "message": user});
    } catch (error) {
        console.log("error while feteching user in checklogin api ",error); 
        res.status(500).json({"message":`Error while feteching userdetails,${error}`})
    }
} 
const editdetails = async (req,res)=>{ 
   const data = req.body ;  
   let email = data.email ;   
   console.log("data\n",data);
    if(!email) return "Email not found in edit details" ;
    
    try { 
    let user = await usercollection.findOneAndUpdate( 
        {"email":data.email} ,
        { 
            $set:{ 
                'name'       :data.name, 
                'phone'       :data.phone, 
                'password'     :data.password, 
                "resumelink"   :data.resumelink,
                "linkdinlink": data.linkdinlink,
                "githublink":   data.githublink,
                'ugDetails'      :data.ugDetails, 
                'pgDetails'       :data.pgDetails, 
                'experiences'     :data.experiences, 
                'projects'        :data.projects
            }
        } ,
        { upsert: true, returnDocument: "after" })  ; 
        try {
            await redis_client.set(email,JSON.stringify(user),{ EX: 3600 })
        } catch (error) {
            console.error("Error while updating vlue in redis\n");
        }
     
    res.status(200).json(user)
   } catch (error) {
    res.status(500).json({"message":`Error while updating userdetails,${error}`})
   }

}
const checkindexing = async (req, res) => {
    try {
        const indexes = await usercollection.getIndexes();
        res.status(200).json(indexes);
    } catch (error) {
        console.error("Error fetching indexes:", error);
        res.status(500).json({ error: "Failed to fetch indexes" });
    }
};

module.exports = {authenticateToken,check_login,editdetails,checkindexing} ; 