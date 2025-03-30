const Razorpay = require('razorpay');
const bodyParser = require('body-parser');
const { validateWebhookSignature } = require('razorpay/dist/utils/razorpay-utils');
const { usercollection, ordercollection } = require('../db');
// // Replace with your Razorpay credentials
const razorpay = new Razorpay({
  key_id: process.env.key_id,
  key_secret: process.env.key_secret,
});


// Route to handle order creation
const createOrder = async (req, res) => {
  try {
    const { amount, currency, receipt, notes, email } = req.body;
    console.log("req.body", req.body);
    const options = {
      amount: amount * 100, // Convert amount to paise
      currency,
      receipt,
      notes,
    };
    const order = await razorpay.orders.create(options);
    console.log("orders", order);
    const query = { email: email };
    const query_option = {
      projection: { _id: 1 },
    }
    let user_id;
    try {
      user_id = await usercollection.findOne(query, query_option);
      console.log("user_id", user_id)
    } catch (error) {
      console.log("error while feteching user in checklogin api ", error);
    }
    const payment_order = await ordercollection.insertOne({ ...order, user_id: user_id });
    console.log("payment_order", payment_order);
    // Read current orders, add new order, and write back to the file
    res.json(order); // Send order details to frontend, including order ID 

  } catch (error) {
    console.error(error);
    console.log("Error creating order")
    res.status(500).send('Error creating order');
  }
};


// Route to handle payment verification
const verifyPayment = async (req, res) => {
  console.log("Entred in verify payment");
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature,amount } = req.body;
  const secret = razorpay.key_secret;
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  try {
    const isValidSignature = validateWebhookSignature(body, razorpay_signature, secret);
    if (isValidSignature) {
      try {
        let updateResult = await ordercollection.updateOne(
          { id: razorpay_order_id },  // Ensure 'id' is correct
          {
              $set: {
                  amount_due: 0,
                  amount_paid: amount,
                  status: "paid"
              }
          }
      );
        console.log("Payment verification successful", updateResult);
      } catch (error) {
        console.log("Error while saving created  order",error)
      }
      res.status(200).json({ status: 'ok' });

    } else {
      res.status(400).json({ status: 'verification_failed' });
      console.log("Payment verification failed");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Error verifying payment' });
  }
};

module.exports = { createOrder, verifyPayment };
