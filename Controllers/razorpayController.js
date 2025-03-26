const Razorpay = require('razorpay');
const bodyParser = require('body-parser');
const { validateWebhookSignature } = require('razorpay/dist/utils/razorpay-utils');


// // Replace with your Razorpay credentials
const razorpay = new Razorpay({
  key_id: 'rzp_live_ey3YUXl20dpPJs',
  key_secret: 'TTUSaQriWuvvjpo7mgHNEHfK',
});

// Route to handle order creation
const createOrder =  async (req, res) => {
  try {
    const { amount, currency, receipt, notes } = req.body;

    const options = {
      amount: amount * 100, // Convert amount to paise
      currency,
      receipt,
      notes,
    };
    const order = await razorpay.orders.create(options); 
    console.log("order",order) ;
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
  console.log("Entred in verify payment") ;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const secret = razorpay.key_secret;
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  try {
    const isValidSignature = validateWebhookSignature(body, razorpay_signature, secret);
    if (isValidSignature) {
      res.status(200).json({ status: 'ok' });
      console.log("Payment verification successful");
    } else {
      res.status(400).json({ status: 'verification_failed' });
      console.log("Payment verification failed");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Error verifying payment' });
  }
};

module.exports = {createOrder,verifyPayment} ;