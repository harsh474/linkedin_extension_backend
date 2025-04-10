
const dotenv = require("dotenv");
dotenv.config()

// Node.js code for caching with Redis
const HOST_NAME = process.env.HOST_NAME
const PASSWORD   = process.env.PASSWORD
const REDIS_PORT = process.env.REDIS_PORT

const redis = require('redis');
const redis_client = redis.createClient({
  host: HOST_NAME,
  port: REDIS_PORT,
  password: PASSWORD,
  tls: {} // Ensures SSL is used
}); 
const mongoose = require('mongoose');
const { hostname } = require("os");
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
 
 