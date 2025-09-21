
const { generateApplicationEmail,generateApplicationEmail2 } = require('./prompt');
const { usercollection, redis_client } = require('../../db'); 
const axios = require('axios');
const { error } = require('console');

const generateEmail = async (req,res)=>{ 
     let email = req.user.email ;
     const query = { email: email };
     let  cached ;  
     if(redis_client)cached = await redis_client.get(email)
     let applicantData = cached?JSON.parse(cached): await usercollection.findOne(query) ;   
     let jobDescription = req.body.message || "";
     redis_client&&!cached&&user&& await redis_client.set(email,JSON.stringify(user),{ EX: 3600 }) // this operation called short-circuiting trick 
     if (!jobDescription || !applicantData) {
          return res.status(400).json({ error: 'Both jobDescription and applicantData are required in the request body.' });
      }
     if (user.currentcount >= user.maxxcount) {
         return res.status(410).json("You pack has expired, recharge Now")
     }
    
     try {
         const emailTemplate = await generateApplicationEmail2(jobDescription, applicantData);
         let user = await usercollection.findOneAndUpdate(
             { email: email },
             {
                 $inc: {
                     currentcount: 1
                 }
             },
             { upsert: true, returnDocument: "after" });
             redis_client&&user&& await redis_client.set(email,JSON.stringify(user),{ EX: 3600 }) // this operation called short-circuiting trick
         return res.status(200).json(emailTemplate);
     } catch (error) {
          console.error('Error generating email:', error);
         return res.status(500).json(`error while writing  email ${error}`)
     }

} 
const generateEmail2 = async (req, res) => {
     console.log("calling generateEmail2",req)
     let jobDescription = req.body.message || "";
     let email = req.user.email ; 
     console.log("email+++++++++++++++++++",email)
     const query = { email: email }; 
     let cached   ; 
    //  if(redis_client)cached = await redis_client.get(email) ; 
 
     let applicantData = cached?JSON.parse(cached):await usercollection.findOne(query);
   
     if (!jobDescription || !applicantData) {
         return res.status(400).json({ error: 'Both jobDescription and applicantData are required in the request body.' });
     }
     try { 
         let webhook_url = "http://localhost:5678/webhook-test/abb22633-63c1-4299-9b67-8a5c8798f157" ;  
           webhook_url = "http://13.60.205.45:5678/webhook/abb22633-63c1-4299-9b67-8a5c8798f157";
         const payload = { 
            event:"Generate Mail", 
            data:{ 
                "jobDescription":jobDescription,
                "applicantData":applicantData
            }
         } 
         axios.get(webhook_url,payload)
         .then((response)=>{ 
            console.log("Webhook succesfully called",response.data['0'])  
            let generatedEmail  = response.data['0'] ; 
             res.status(200).json(generatedEmail);
         })
         .catch((error)=>{ 
            console.log('Error Calling Webhook',error.message);
             res.status(500).json({ error: 'Failed to generate email.', details: error.message });
         })
        //  const generatedEmail = await generateApplicationEmail2(jobDescription, applicantData);
        //  res.status(200).json(generatedEmail);
     } catch (error) {
         console.error('Error generating email:', error);
         res.status(500).json({ error: 'Failed to generate email.', details: error.message });
     }
 }
module.exports = {generateEmail,generateEmail2}
