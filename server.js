  const express = require("express");
  const axios = require("axios");
  const dotenv = require("dotenv");
  const cors = require('cors');
  const mongoose = require('mongoose')
  const jwt = require('jsonwebtoken')
  const bcrypt = require("bcryptjs")
  const cookieParser = require('cookie-parser')
  dotenv.config();  // Load environment variables
  const Razorpay = require('razorpay');
  const path = require('path');
  
  const { validateWebhookSignature } = require('razorpay/dist/utils/razorpay-utils');
  let mongo_url = "mongodb://localhost:27017/email"   ;
    mongo_url = process.env.Mongo_url
  
 
  // mongoose.connect('mongodb://localhost:27017/email')
  mongoose.connect(`${mongo_url}`)
      .then(() => console.log("succesfully connected to mongodb databse "))
      .catch((error) => console.log("Cant connect to databse "))
      
  const emailcollection = mongoose.connection.collection('email');
  const usercollection = mongoose.connection.collection('user') ; 
  
  const app = express();

  const PORT = process.env.PORT||3001 ;
  app.use(express.json());
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors({  origin:['http://localhost:3000','chrome-extension://mggcnpciocmgadnfpkooinmkgikobmoi'], 
      credentials:true,            //access-control-allow-credentials:true
      optionSuccessStatus:200}));
  let SECRET_KEY = process.env.SECRET_KEY;
  app.get('/', (req, res) => {
      res.send("Hello World");
  });

  app.set('trust proxy', 1) // trust first proxy


const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers["authorization"]; // Ensure header is lowercase
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json("You are not logged in");
    }

    console.log("Authentication in progress...");

    jwt.verify(token, SECRET_KEY, (error, user) => {
        if (error) {
            console.log("JWT Error:", error);

            // If the token is expired
            if (error.name === "TokenExpiredError") {
                return res.status(401).json("Token expired, please login again.");
            }

            return res.status(401).json("Invalid token, please login again.");
        }

        req.user = user;
        console.log("Authenticated successfully", req.user);
        next();
    });
};

// app.post('/chatgpt', authenticateToken, async (req, res) => {
//     const userMessage = req.body.message || "";
//     // console.log("entered in chatgpt",userMessage,);
//     try {
//         // Fetch user information from database
//         const applicantData = await usercollection.find({ email: req.user.email }).limit(1).toArray(); 
//         const currentcount = applicantData[0].currentcount ; 
//         const maxxcount = applicantData[0].maxxcount ; 
//         if(currentcount>=maxxcount){ 
//             console.log("message","you have Hit current limit .Please recharge !")
//           return  res.status(501).json({"message":"you have Hit current limit .Please recharge !"})
//         }
//         //  = await usercollection.findById(req.user._id).lean();
//         console.log(applicantData[0].name);
//         const Applicant_information = {
//             name: applicantData[0].name || 'N/A', // replace with actual field
//             resumeLink: applicantData[0].Resume || 'N/A', // replace with actual field
//             institution: applicantData[0].institution || 'N/A', // replace with actual field
//             graduationYear: applicantData[0].graduationYear || 'N/A', // replace with actual field
//             companyName: applicantData[0].companyName || 'N/A',
//             role: applicantData[0].role || 'N/A',
//             experienceDescription: applicantData[0].experienceDescription || 'N/A',
//             github:applicantData[0].GitHub||'N/A',
//             linkedin:applicantData[0].LinkedIn||'N/A',
//             email:applicantData[0].email||'N/A'
//             // Add other relevant fields as needed
//         };
//         // let jsonResponse;
//         // try {
//         // const response = await axios.post('https://api.openai.com/v1/chat/completions', {
//         //     model: 'gpt-3.5-turbo',
//         //     messages: [
//         //         {
//         //             "role": "system",
//         //             "content": "You are an expert recruiter assistant."
//         //         },
//         //         {
//         //             "role": "user",
//         //             "content": `You are given a LinkedIn job post regarding a job opening by a recruiter. As an applicant, analyze the post and extract the following details: 
//         //             // ... (rest of your prompt)
//         //             `
//         //         },
//         //         {
//         //             "role": "user",
//         //             "content": userMessage
//         //         },
//         //         {
//         //             "role": "user",
//         //             "content": `REPLACE USER AND COMPANY INFORMATION FROM ${JSON.stringify(applicantData)} and company name and hr name from ${userMessage}`
//         //         },
//         //         {
//         //             "role": "user",
//         //             "content": "Please clean the response to remove any special characters, new lines, or slashes, ensuring it is a clean JSON object."
//         //         }
//         //     ]
//         // }, {
//         //     headers: {
//         //         'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
//         //         'Content-Type': 'application/json'
//         //     }
//         // });
//         // console.log("response")
//         // console.log("authentication")

//         // let assistantResponse = response.data.choices[0].message.content;

//         // // Clean the response further if needed
//         // let cleanedResponse = assistantResponse.replace(/\\/g, '').replace(/\n/g, '');

//         // // Parse the cleaned response as JSON

//         //     jsonResponse = JSON.parse(cleanedResponse);
//         // } catch (error) {
//         //     console.log("chat_error",error)
//         //     jsonResponse = {
//         //         "recruiter_name": "N/A",
//         //         "experience": "N/A",
//         //         "email": "N/A",
//         //         "subject": "N/A",
//         //         "body": "N/A"
//         //     };
//         // }
//         try {
//             const response = await axios.post('https://api.openai.com/v1/chat/completions', {
//                 model: 'gpt-3.5-turbo',
//                 messages: [
//                     {
//                         "role": "system",
//                         "content": "You are an expert recruiter assistant."
//                     },
//                     {
//                         "role": "user",
//                         "content": `You are given a LinkedIn job post regarding a job opening by a recruiter. As an applicant, analyze the post and extract the following details: 
//                             1. The recruiter's name  as "recruiter_name"
//                             2. The required years of experience as "experience"
//                             3. The email address to which applications should be sent stored in "email"
//                             4. Job Title as "job_title"
//                             5. job Id as "job_id"
//                             6. Name of the comapny as "company"
//                             7. write subject for the mail like 'Application for senior data engineer' as subject
//                             Format your response as a JSON object with keys: 'recruiter_name', 'experience', 'email', 'job_title',  'job_id',subject and 'company'. 
//                             If any information is missing, use 'N/A' as the value.`
//                     },
//                     {
//                         "role": "user",
//                         "content": userMessage.content // LinkedIn post content provided by the user 
//                     },
//                     {
//                         "role": "user",
//                         "content": JSON.stringify(Applicant_information) // Applicant info in string form
//                     },
//                     {
//                         "role": "user",
//                         "content": `REPLACE USER AND COMPANY INFORMATION from ${JSON.stringify(Applicant_information)} and extract company name and recruiter name from ${userMessage}`
//                     },
//                     {
//                         "role": "user",
//                         "content": "Please clean the response to remove any special characters, new lines, or slashes, ensuring it is a clean JSON object."
//                     }
//                 ]
//             }, {
//                 headers: {
//                     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
//                     'Content-Type': 'application/json'
//                 }
//             });

//             // console.log("response", response.data);
//             let assistantResponse = response.data.choices[0].message.content;

//             // Clean the response to remove unwanted characters
//             let cleanedResponse = assistantResponse.replace(/\\/g, '').replace(/\n/g, '').replace(/\\n/g, '');

//             // Parse the cleaned response as JSON
//             let jsonResponse;
//             try {
//                 jsonResponse = JSON.parse(cleanedResponse);
//             } catch (error) {

//                 console.log('Error parsing JSON:', error);
//                 jsonResponse = {
//                     "recruiter_name": "N/A",
//                     "experience": "N/A",
//                     "email": "N/A",
//                     "body": "N/A",
//                     "job_title": "N/A",
//                     "job_id":"N/A",
//                     "subject": "N/A",
//                     "comapny":"N/A"
//                 }; // Default in case of error
//             }

//             // Prepare the email format
//             const emailTemplate = {
//                 "To": jsonResponse.email !== "N/A" ? jsonResponse.email : "example@example.com", // Default email if N/A
//                 "Subject": jsonResponse.subject !== "N/A" ? jsonResponse.subject : `Application for ${jsonResponse.job_title}'s job job id ${jsonResponse.Job_id} at ${jsonResponse.comapny}`,
//                 "Body": `Dear ${jsonResponse.recruiter_name !== "N/A" ? jsonResponse.recruiter_name : "Hiring Manager"},\n\n` +
//                     `I am writing to express my interest in the ${jsonResponse.job_title || "open position"} at ${jsonResponse.company || "your company"}. ` +
//                     `With my experience in ${Applicant_information.expertise || "the relevant field"}, I believe I am a strong candidate for this role. \n\n` +
//                     `Please find my resume attached for your consideration. I look forward to discussing how my skills and experiences align with the needs of your team. \n\n` +
//                     `Thank you for your time and consideration.\n\n` +
//                     `Best regards,\n${Applicant_information.name}\n` +
//                     `Email:${Applicant_information.email}\nGitHub: ${Applicant_information.github}\nLinkedIn: ${Applicant_information.linkedin}\nResume: ${Applicant_information.resumeLink}`
//             };

//             // Insert the email template into MongoDB
//             let result = await emailcollection.insertOne(emailTemplate);
//             console.log(emailTemplate);  

//             // incrementing count  
//             var count  = applicantData[0].currentcount ;  
//             result = usercollection.updateOne(
//              {email:req.user.email},
//              { 
//                 $set:{'currentcount':count+1}
//              }
//             )
          

//             // Return the email template as a JSON response
//             res.status(200).json(emailTemplate);

//         } catch (error) {
//             console.error('Error processing request:', error);
//             res.status(500).json({ error: 'An error occurred while processing the request.' });
//         }

//     } catch (error) {
//         console.log("error", error)
//         console.error("Error calling ChatGPT API:", error);
//         res.status(500).send("Error calling ChatGPT API");
//     }
// });


app.post('/chatgpt', authenticateToken, async (req, res) => {
  const userMessage = req.body.message ||"" ; 
  try {
      // Fetch user information from database
      const applicantData = await usercollection.find({ email: req.user.email }).limit(1).toArray();
      const currentcount = applicantData[0].currentcount;
      const maxxcount = applicantData[0].maxxcount;

      if (currentcount >= maxxcount) {
          return res.status(501).json({ "message": "You have hit your current limit. Please recharge!" });
      }

      const Applicant_information = {
          name: applicantData[0].name || 'N/A',
          resumeLink: applicantData[0].Resume || 'N/A',
          institution: applicantData[0].institution || 'N/A',
          graduationYear: applicantData[0].graduationYear || 'N/A',
          companyName: applicantData[0].companyName || 'N/A',
          role: applicantData[0].role || 'N/A',
          experienceDescription: applicantData[0].experienceDescription || 'N/A',
          github: applicantData[0].GitHub || 'N/A',
          linkedin: applicantData[0].LinkedIn || 'N/A',
          email: applicantData[0].email || 'N/A'
      };

      try {
          const response = await axios.post('https://api.openai.com/v1/chat/completions', {
              model: 'gpt-3.5-turbo',
              messages: [
                  {
                      "role": "system",
                      "content": "You are an expert recruiter assistant. Extract and structure data for job applications."
                  },
                  {
                      "role": "user",
                      "content": `Analyze the LinkedIn job post below and extract the following details as JSON:
1. Recruiter name: "recruiter_name"
2. Experience requirement: "experience"
3. Email to apply: "email"
4. Job title: "job_title"
5. Job ID (if available): "job_id"
6. Company name: "company"
7. Email subject: Suggested subject for applying (e.g., "Application for Python Developer")

If any information is missing in the post, use 'N/A'. Ensure the response is a clean JSON object without extra characters or formatting.`
                  },
                  {
                      "role": "user",
                      "content": userMessage // LinkedIn post content provided by the user
                  },
                  {
                      "role": "user",
                      "content": `Insert applicant details: ${JSON.stringify(Applicant_information)}. Use these details to personalize the response.`
                  }
              ]
          }, {
              headers: {
                  'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                  'Content-Type': 'application/json'
              }
          });

          let assistantResponse = response.data.choices[0].message.content;

          // Clean the response
          let cleanedResponse = assistantResponse.replace(/\\/g, '').replace(/\n/g, '').replace(/\\n/g, '');

          // Parse the JSON response
          let jsonResponse;
          try {
              jsonResponse = JSON.parse(cleanedResponse);
          } catch (error) {
              console.error('Error parsing JSON:', error);
              jsonResponse = {
                  "recruiter_name": "N/A",
                  "experience": "N/A",
                  "email": "N/A",
                  "job_title": "N/A",
                  "job_id": "N/A",
                  "subject": "N/A",
                  "company": "N/A"
              };
          }

          // Prepare the email format
          const emailTemplate = {
              "To": jsonResponse.email !== "N/A" ? jsonResponse.email : "example@example.com",
              "Subject": jsonResponse.subject !== "N/A" ? jsonResponse.subject : `Application for ${jsonResponse.job_title || 'a position'} at ${jsonResponse.company || 'your company'}`,
              "Body": `Dear ${jsonResponse.recruiter_name !== "N/A" ? jsonResponse.recruiter_name : "Hiring Manager"},\n\n` +
                  `I am writing to express my interest in the ${jsonResponse.job_title || "open position"} at ${jsonResponse.company || "your company"}. ` +
                  `With my experience in ${Applicant_information.experienceDescription || "the relevant field"}, I believe I am a strong candidate for this role.\n\n` +
                  `Please find my resume attached for your consideration. I look forward to discussing how my skills and experiences align with the needs of your team.\n\n` +
                  `Thank you for your time and consideration.\n\n` +
                  `Best regards,\n${Applicant_information.name}\n` +
                  `Email: ${Applicant_information.email}\nGitHub: ${Applicant_information.github}\nLinkedIn: ${Applicant_information.linkedin}\nResume: ${Applicant_information.resumeLink}`
          };

          // Save email template to database
          await emailcollection.insertOne(emailTemplate);

          // Increment count
          await usercollection.updateOne(
              { email: req.user.email },
              { $set: { 'currentcount': currentcount + 1 } }
          );

          res.status(200).json(emailTemplate);

      } catch (error) {
          console.error('Error processing request:', error);
          res.status(500).json({ error: 'An error occurred while processing the request.' });
      }

  } catch (error) {
      console.error("Error:", error);
      res.status(500).send("Error calling ChatGPT API");
  }
});


app.post('/signupform', async (req, res) => {
    const data = req.body.formdata;
    try {
        const result = usercollection.insertOne(data);
        res.send("sucessfuly save user data")
    } catch (error) {
        console.error("Error while saving data", error.response ? error.response.data : error.message)
        res.status(500).json({ "error while saving data": error })
    }
})


app.post('/login', async (req, res) => {
    try { 
       
        const { email, pass } = req.body;
         if(req.cookies.token){  
         
          return  res.status(200).json({"message":"User is already login"}) ;
         }
        // Find the user by email
        const user = await usercollection.findOne({ email: email }); 
      
        if (!user) {    
            return res.status(404).json({ error: "You are not registered, kindly register." });
        }
        if (user.password !== pass) {
            return res.status(401).json({ error: "Password is not correct" });
        }
        // Compare the hashed password with the password from the request
      

        //   const isMatch = await bcrypt.compare(pass, user.password);
        //   if (!isMatch) { 
        //     console.log("Invalid credentials")
        //     return res.status(403).json({ error: "Invalid credentials" });
        //   }

        // Create a JWT token
        const token = jwt.sign({ email: user.email }, SECRET_KEY);
        res.cookie("token",token,{
            httpOnly: true,  // Prevents client-side access to the cookie
            secure: true,    // Ensures the cookie is only sent over HTTPS
            sameSite: "none" ,// Required for cross-origin cookies
            domain:"linkdinextensionbackend-dzc7dterc9cggrhd.eastus-01.azurewebsites.net"
                    
          });
        // Set the token as a cookie and send a successful response
        res.status(200).json({ message: "Successfully logged in", "token": token });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get('/logout',(req,res)=>{ 
    res.clearCookie('token'); 
    res.status(200).send("User logout successfully"); 
});


app.get('/check-login',(req,res)=>{
    const  token = req.cookies.token;
    if(token){ 
        res.status(200).send({"message":`true,{token}`}) ;
    }
    else{ 
        res.status(400).send({"message":"false,{token}"}) ;
    }
})





// Replace with your Razorpay credentials
const razorpay = new Razorpay({
    key_id: 'rzp_test_UckZXEaT1ygZFP',
    key_secret: 'XG4wriFTgDEfWdjIEzpcgS1V',
  });
  
 
 
  
 
  // Route to serve the success page
  app.get('/payment-success', (req, res) => {
    res.sendFile(path.join(__dirname, 'success.html'));
  });   
  
  // Route to handle payment verification
  app.post('/verify-payment', (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  
    const secret = razorpay.key_secret;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
  
    try {
      const isValidSignature = validateWebhookSignature(body, razorpay_signature, secret);
      if (isValidSignature) {
        // Update the order with payment details
        const orders = readData();
        const order = orders.find(o => o.order_id === razorpay_order_id);
        if (order) {
          order.status = 'paid';
          order.payment_id = razorpay_payment_id;
          writeData(orders);
        }
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
  });
   
  app.post('/payment/checkout',async(req,res)=>{ 
    const {name,amount} = req.body ; 
     try { 
        let order ;
          try {
             order = await razorpay.orders.create({  
                amount : Number(amount*100),
                currency:"INR", 
            })  
    
          } catch (error) {
            console.log("error while calling razorpay in backend",error);
          }
          console.log("created order in backend",order);
        res.json(order);
     } catch (error) {
        console.log("error in backend",error);
     }
   
  })
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
