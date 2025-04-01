const Razorpay = require('razorpay');
const bodyParser = require('body-parser');
const { validateWebhookSignature } = require('razorpay/dist/utils/razorpay-utils');
const { usercollection, ordercollection } = require('../db');
require('dotenv').config(); // Load environment variables
// // Replace with your Razorpay credentials 
// Ensure environment variables are correctly loaded
if (!process.env.KEY_ID || !process.env.KEY_SECRET) {
  console.error("Razorpay API keys are missing!");
 
  process.exit(1); // Exit if keys are not set
}
const razorpay = new Razorpay({
  key_id: process.env.KEY_ID,       // Use correct environment variable names
  key_secret: process.env.KEY_SECRET
});

let email_id , increment = 0;

// Route to handle order creation
const createOrder = async (req, res) => {
  try {
    const { amount, currency, receipt, notes,email} = req.body;
    email_id = email ;
    if (receipt === "Basic") increment = 12;
    else if (receipt === "Standard") increment = 100;
    else if (receipt === "Premium") increment = 500;
   
    const options = {
      amount: amount * 100, // Convert amount to paise
      currency,
      receipt,
      notes,
    };
    const order = await razorpay.orders.create(options);
   
    const query = { email: email };
    const query_option = {
      projection: { _id: 1 },
    }
    let user_id;
    try {
      user_id = await usercollection.findOne(query, query_option);
     
    } catch (error) {
     
    }
    const payment_order = await ordercollection.insertOne({ ...order, user_id: user_id });
  
    // Read current orders, add new order, and write back to the file
    res.status(200).json(order); // Send order details to frontend, including order ID 
  } catch (error) {
    console.error(error);
    
    res.status(500).send('Error creating order');
  }
};


// Route to handle payment verification
const verifyPayment = async (req, res) => { 
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
  const secret = razorpay.key_secret;
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  try {
    const isValidSignature = validateWebhookSignature(body, razorpay_signature, secret);
    if (isValidSignature) { 
      
      try {
        let updateResult = await ordercollection.findOneAndUpdate(
          { id: razorpay_order_id },  // Ensure 'id' is correct
          {
            $set: {
              amount_due: 0,
              amount_paid: amount,
              status: "paid"
            }
          },
          { upsert: true, returnDocument: "after" });
        let updatedcount = await usercollection.findOneAndUpdate(
          { email: email_id },
          {
            $inc: { maxxcount: increment }
          },
          { upsert: true, returnDocument: "after" });
        
      } catch (error) {
        console.erro("Error while saving created  order", error); 
        return res.status(400).json("Error while creating and updating count and order in  varifyment")
      }
      res.status(200).json({ status: 'ok' });

    } else {
      res.status(400).json({ status: 'verification_failed' });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error verifying payment' });
  }
};

module.exports = { createOrder, verifyPayment };
