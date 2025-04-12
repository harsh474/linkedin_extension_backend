
const dotenv = require("dotenv");
dotenv.config()

// Node.js code for caching with Redis
const HOST_NAME = process.env.HOST_NAME
const PASSWORD   = process.env.PASSWORD
const REDIS_PORT = process.env.REDIS_PORT

const redis = require('redis');

// Create Redis client with SSL and access key
const redis_client = redis.createClient({
  socket: {
    host: HOST_NAME,
    port: REDIS_PORT,
    tls: true  // enables SSL (required for Azure)
  },
  password: PASSWORD  // access key from Azure
}); 

const mongoose = require('mongoose');
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
 
 