
const { generateApplicationEmail,generateApplicationEmail2 } = require('./prompt');
const { usercollection, redis_client } = require('../../db'); 

const generateEmail = async (req,res)=>{ 
     let email = req.user.email ;
     const query = { email: email };
     let cached = await redis_client.get(email)
     let applicantData = cached?JSON.parse(cached): await usercollection.findOne(query) ;   
     let jobDescription = req.body.message || "";
     !cached&&user&& await redis_client.set(email,JSON.stringify(user),{ EX: 3600 }) // this operation called short-circuiting trick 
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
             user&& await redis_client.set(email,JSON.stringify(user),{ EX: 3600 }) // this operation called short-circuiting trick
         return res.status(200).json(emailTemplate);
     } catch (error) {
          console.error('Error generating email:', error);
         return res.status(500).json(`error while writing  email ${error}`)
     }

} 
const generateEmail2 = async (req, res) => {

     let jobDescription = req.body.jobDescription || "";
 
     let email = req.user.email ;
     const query = { email: email }; 
     let cached = await redis_client.get(email) ; 
 
     let applicantData = cached?JSON.parse(cached):await usercollection.findOne(query);
   
     if (!jobDescription || !applicantData) {
         return res.status(400).json({ error: 'Both jobDescription and applicantData are required in the request body.' });
     }
     try {
         const generatedEmail = await generateApplicationEmail2(jobDescription, applicantData);
         res.status(200).json(generatedEmail);
     } catch (error) {
         console.error('Error generating email:', error);
         res.status(500).json({ error: 'Failed to generate email.', details: error.message });
     }
 }
module.exports = {generateEmail,generateEmail2}
