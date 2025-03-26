const mongoose = require('mongoose') ; 
const Schema = mongoose.schema ; 

let UserSchema = new Schema({ 
    order_id : String , 
    order_amount : String ,  
    order_date : Date, 
    plan_type: String ,  
    paymentcollection: [{ 
         type : Schema.Types.ObjectId, 
        ref: "Order"
    }]
})
module.exports = mongoose.model("User",UserSchema) ; 
