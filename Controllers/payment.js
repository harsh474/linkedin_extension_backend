import PaymentModel from "../models/PaymentModel"
const payment_collection = async (req,res)=>{ 
             try {
                let  data = req.body ; 
                let payment = PaymentModel.save(data,req.user) ;
                  return {"status":"success", "message":`Payment done sucecssfully with payment id : ${payment}`}
                 
             } catch (error) {
                return {"status":"error", "message":`Payment failed ${error}`}

             }
}

