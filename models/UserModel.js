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
const User = mongoose.model("User",UserSchema) ; 
