const mongoose = require('mongoose') ; 
const Schema = mongoose.schema ; 

let OrderSchema = new Schema({ 
    order_id : String , 
    amount : Number ,  
    order_date : Date, 
    receipt: String ,  
    status:String,
    payment_id:String,
    owner : { 
        type : Schema.Types.ObjectId, 
        ref: "User"
    }
})
module.exports = mongoose.model("Order",OrderSchema) ; 