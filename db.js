
const dotenv = require("dotenv");
dotenv.config()

// Node.js code for caching with Redis
const redis = require('redis');
const redis_client = redis.createClient(); 
const mongoose = require('mongoose')
let mongo_url = "mongodb://localhost:27017/email";
mongo_url = process.env.Mongo_url

// mongoose.connect('mongodb://localhost:27017/email')
mongoose.connect(`${mongo_url}`)
    .then(async() => {console.log("succesfully connected to mongodb databse "); 
        redis_client.on('error', err => console.log('Redis Client Error', err));
        await redis_client.connect();
        console.log(" Connected to Redis");
        await mongoose.connection.db.collection('user').createIndex({email:1},{unique:true}); 
        console.log(" Index on 'email' created");
        })
    .catch((error) => console.log("Cant connect to databse ",error))
const db =  mongoose.connection ;
const usercollection = db.collection('user');
const ordercollection = db.collection('orders') 

module.exports = { 
     usercollection,ordercollection,redis_client
 };
 
 