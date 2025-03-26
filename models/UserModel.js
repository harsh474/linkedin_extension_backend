const mongoose = require('mongoose') ; 
const schema = mongoose.Schema ; 

let UserSchema = new schema({ 
    order_id : String , 
    order_amount : String ,  
    order_date : Date, 
    plan_type: String ,  
    paymentcollection: [{ 
        type : schema.Types.ObjectId, 
        ref: "Order"
    }]
})
module.exports = mongoose.model("User",UserSchema) ; 
