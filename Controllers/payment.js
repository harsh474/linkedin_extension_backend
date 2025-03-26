const {Order} = require('../models/PaymentModel')

const payment_collection = async (req,res)=>{ 
             try {
                let  data = req.body ; 
                let order = Order.save(data,req.user) ;
                  return {"status":"success", "message":`Payment done sucecssfully with payment id : ${order}`}
                 
             } catch (error) {
                return {"status":"error", "message":`Payment failed ${error}`}

             }
}

module.exports = {payment_collection}
