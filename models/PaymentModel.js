const mongoose  = require('mongoose');
const schema = mongoose.Schema ; 
let OrderSchema = new schema({ 
    order_id : String , 
    amount : Number ,  
    order_date : Date, 
    receipt: String ,  
    status:String,
    payment_id:String,
    owner : { 
        type :schema.Types.ObjectId,
        ref: "User"
    }
})
const order = mongoose.model("Order",OrderSchema) ; 
module.exports = order  ;