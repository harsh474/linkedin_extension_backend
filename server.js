const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const cors = require('cors');
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const bcrypt = require("bcryptjs")
const cookieParser = require('cookie-parser')
dotenv.config();  // Load environment variables

// Connect to MongoDB using Mongoose


mongoose.connect('mongodb://localhost:27017/email')
    .then(() => console.log("succesfully connected to mongodb databse "))
    .catch((error) => console.log("Cant connect to databse "))
const emailcollection = mongoose.connection.collection('email');
const usercollection = mongoose.connection.collection('user')
const app = express();
const PORT = 3001;

app.use(express.json());

app.use(cors({
    origin: '*'
}));
SECRET_KEY = process.env.SECRET_KEY;
app.get('/', (req, res) => {
    res.send("Hello World");
});




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

app.post('/chatgpt', authenticateToken, async (req, res) => {
    const userMessage = req.body.message || "";
    console.log("entered in chatgpt")
    try {
        // Fetch user information
        const applicantData = await usercollection.find({ email: req.user.email }).limit(1).toArray(); 
        const currentcount = applicantData[0].currentcount ; 
        const maxxcount = applicantData[0].maxxcount ; 
        if(currentcount>=maxxcount){ 
            console.log("message","you have Hit current limit .Please recharge !")
          return  res.status(501).json({"message":"you have Hit current limit .Please recharge !"})
        }
        //  = await usercollection.findById(req.user._id).lean();
        console.log(applicantData[0].name);
        const Applicant_information = {
            name: applicantData[0].name || 'N/A', // replace with actual field
            resumeLink: applicantData[0].Resume || 'N/A', // replace with actual field
            institution: applicantData[0].institution || 'N/A', // replace with actual field
            graduationYear: applicantData[0].graduationYear || 'N/A', // replace with actual field
            companyName: applicantData[0].companyName || 'N/A',
            role: applicantData[0].role || 'N/A',
            experienceDescription: applicantData[0].experienceDescription || 'N/A',
            github:applicantData[0].GitHub||'N/A',
            linkedin:applicantData[0].LinkedIn||'N/A',
            email:applicantData[0].email||'N/A'
            // Add other relevant fields as needed
        };
        // let jsonResponse;
        // try {
        // const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        //     model: 'gpt-3.5-turbo',
        //     messages: [
        //         {
        //             "role": "system",
        //             "content": "You are an expert recruiter assistant."
        //         },
        //         {
        //             "role": "user",
        //             "content": `You are given a LinkedIn job post regarding a job opening by a recruiter. As an applicant, analyze the post and extract the following details: 
        //             // ... (rest of your prompt)
        //             `
        //         },
        //         {
        //             "role": "user",
        //             "content": userMessage
        //         },
        //         {
        //             "role": "user",
        //             "content": `REPLACE USER AND COMPANY INFORMATION FROM ${JSON.stringify(applicantData)} and company name and hr name from ${userMessage}`
        //         },
        //         {
        //             "role": "user",
        //             "content": "Please clean the response to remove any special characters, new lines, or slashes, ensuring it is a clean JSON object."
        //         }
        //     ]
        // }, {
        //     headers: {
        //         'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        //         'Content-Type': 'application/json'
        //     }
        // });
        // console.log("response")
        // console.log("authentication")

        // let assistantResponse = response.data.choices[0].message.content;

        // // Clean the response further if needed
        // let cleanedResponse = assistantResponse.replace(/\\/g, '').replace(/\n/g, '');

        // // Parse the cleaned response as JSON

        //     jsonResponse = JSON.parse(cleanedResponse);
        // } catch (error) {
        //     console.log("chat_error",error)
        //     jsonResponse = {
        //         "recruiter_name": "N/A",
        //         "experience": "N/A",
        //         "email": "N/A",
        //         "subject": "N/A",
        //         "body": "N/A"
        //     };
        // }
        try {
            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        "role": "system",
                        "content": "You are an expert recruiter assistant."
                    },
                    {
                        "role": "user",
                        "content": `You are given a LinkedIn job post regarding a job opening by a recruiter. As an applicant, analyze the post and extract the following details: 
                            1. The recruiter's name  as "recruiter_name"
                            2. The required years of experience as "experience"
                            3. The email address to which applications should be sent stored in "email"
                            4. Job Title as "job_title"
                            5. job Id as "job_id"
                            6. Name of the comapny as "company"
                            7. write subject for the mail like 'Application for senior data engineer' as subject
                            Format your response as a JSON object with keys: 'recruiter_name', 'experience', 'email', 'job_title',  'job_id',subject and 'company'. 
                            If any information is missing, use 'N/A' as the value.`
                    },
                    {
                        "role": "user",
                        "content": userMessage // LinkedIn post content provided by the user 
                    },
                    {
                        "role": "user",
                        "content": JSON.stringify(Applicant_information) // Applicant info in string form
                    },
                    {
                        "role": "user",
                        "content": `REPLACE USER AND COMPANY INFORMATION from ${JSON.stringify(Applicant_information)} and extract company name and recruiter name from ${userMessage}`
                    },
                    {
                        "role": "user",
                        "content": "Please clean the response to remove any special characters, new lines, or slashes, ensuring it is a clean JSON object."
                    }
                ]
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            // console.log("response", response.data);
            let assistantResponse = response.data.choices[0].message.content;

            // Clean the response to remove unwanted characters
            let cleanedResponse = assistantResponse.replace(/\\/g, '').replace(/\n/g, '').replace(/\\n/g, '');

            // Parse the cleaned response as JSON
            let jsonResponse;
            try {
                jsonResponse = JSON.parse(cleanedResponse);
            } catch (error) {

                console.log('Error parsing JSON:', error);
                jsonResponse = {
                    "recruiter_name": "N/A",
                    "experience": "N/A",
                    "email": "N/A",
                    "body": "N/A",
                    "job_title": "N/A",
                    "job_id":"N/A",
                    "subject": "N/A",
                    "comapny":"N/A"
                }; // Default in case of error
            }

            // Prepare the email format
            const emailTemplate = {
                "To": jsonResponse.email !== "N/A" ? jsonResponse.email : "example@example.com", // Default email if N/A
                "Subject": jsonResponse.subject !== "N/A" ? jsonResponse.subject : `Application for ${jsonResponse.job_title}'s job job id ${jsonResponse.Job_id} at ${jsonResponse.comapny}`,
                "Body": `Dear ${jsonResponse.recruiter_name !== "N/A" ? jsonResponse.recruiter_name : "Hiring Manager"},\n\n` +
                    `I am writing to express my interest in the ${jsonResponse.job_title || "open position"} at ${jsonResponse.company || "your company"}. ` +
                    `With my experience in ${Applicant_information.expertise || "the relevant field"}, I believe I am a strong candidate for this role. \n\n` +
                    `Please find my resume attached for your consideration. I look forward to discussing how my skills and experiences align with the needs of your team. \n\n` +
                    `Thank you for your time and consideration.\n\n` +
                    `Best regards,\n${Applicant_information.name}\n` +
                    `Email:${Applicant_information.email}\nGitHub: ${Applicant_information.github}\nLinkedIn: ${Applicant_information.linkedin}\nResume: ${Applicant_information.resumeLink}`
            };

            // Insert the email template into MongoDB
            let result = await emailcollection.insertOne(emailTemplate);
            console.log(emailTemplate);  

            // incrementing count  
            var count  = applicantData[0].currentcount ;  
            result = usercollection.updateOne(
             {email:req.user.email},
             { 
                $set:{'currentcount':count+1}
             }
            )
          

            // Return the email template as a JSON response
            res.status(200).json(emailTemplate);

        } catch (error) {
            console.error('Error processing request:', error);
            res.status(500).json({ error: 'An error occurred while processing the request.' });
        }

    } catch (error) {
        console.log("error", error)
        console.error("Error calling ChatGPT API:", error);
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

        // Find the user by email
        const user = await usercollection.findOne({ email: email });
        if (!user) {
            return res.status(404).json({ error: "You are not registered, kindly register." });
        }
        if (user.password !== pass) {
            return res.status(401).json({ error: "Password is not correct" });
        }
        // Compare the hashed password with the password from the request
        //   const isMatch = await bcrypt.compare(pass, user.pass);
        //   if (!isMatch) {
        //     return res.status(403).json({ error: "Invalid credentials" });
        //   }

        // Create a JWT token
        const token = jwt.sign({ email: user.email }, SECRET_KEY);

        // Set the token as a cookie and send a successful response
        res.status(200).json({ message: "Successfully logged in", "token": token });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
