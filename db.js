
const dotenv = require("dotenv");
dotenv.config()

const mongoose = require('mongoose')
let mongo_url = "mongodb://localhost:27017/email";
mongo_url = process.env.Mongo_url

const redis = require('redis');
const redis_client = redis.createClient();

// mongoose.connect('mongodb://localhost:27017/email')
mongoose.connect(`${mongo_url}`)
    .then(() => console.log("succesfully connected to mongodb databse "))
    .catch((error) => console.log("Cant connect to databse ",error))
const db =  mongoose.connection ;
// const emailcollection = db.collection('email');
const usercollection = db.collection('user');
const ordercollection = db.collection('orders')
module.exports = { 
     usercollection,ordercollection,redis_client
 };
 
 