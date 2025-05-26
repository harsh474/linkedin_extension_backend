require('dotenv').config();
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require("@google/generative-ai"); 
const {callGeminiAPI}  = require('./geminiClient')
const prompts = require('./prompts'); // Import the prompts
const YOUR_API_KEY = process.env.GEMNI_API_KEY;
const genAI = new GoogleGenerativeAI(YOUR_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- Email Generation Function (using imported prompts) ---
async function generateApplicationEmail(jobDescription, applicantData) {
    try {
     
        //  setp 11 : direct email writing 
        let applicantDataString = JSON.stringify(applicantData); // ✅ Convert to JSON string
        const email_body = await model.generateContent(prompts.promptStep11(jobDescription,applicantDataString))
        let email_bodyString =  email_body.response.candidates[0].content.parts[0].text; 
        email_bodyString  = email_bodyString.replace(/```json\n?/, '').replace(/```/, '')  // removes the opening ```json (with optional newline)     // removes the closing ``` 
        email_bodyString = JSON.parse(email_bodyString);
        console.log("email_bodyString\n",email_bodyString)
        return email_bodyString 

    } catch (error) {
        console.error("Error generating email:", error);
        return { subject: "Error Generating Subject", emailBody: "An error occurred while generating the email." };
    }
}

async function generateApplicationEmail2(jobDescription, applicantData) {
    try {
        
        const extractionPrompt = prompts.getExtractionPrompt(jobDescription);
        let extractedResponse = await callGeminiAPI(extractionPrompt); 
        extractedResponse  = extractedResponse.replace(/```json\n?/, '').replace(/```/, '')  // removes the opening ```json (with optional newline)     // removes the closing ``` 
        const jobData = JSON.parse(extractedResponse); // assuming valid JSON string is returned
    
        // STEP 2: Generate email using jobData and userData
        const emailPrompt = prompts.getEmailPrompt(jobData, applicantData); 
        let emailText = await callGeminiAPI(emailPrompt);
        emailText  = emailText.replace(/```json\n?/, '').replace(/```/, '')  // removes the opening ```json (with optional newline)     // removes the closing ``` 

        // Format output
        const subject = `Application for ${jobData.role} - ${applicantData.name}`;
        const to = jobData.recruiter_email || null;
    
        const  email_bodyString = {
          "To":to,
          "subject":subject,
          "body": emailText
        };
        console.log("email_bodyString\n",email_bodyString.body)
        return email_bodyString 

    } catch (error) {
        console.error("Error generating email:", error);
        return { subject: "Error Generating Subject", emailBody: "An error occurred while generating the email." };
    }
}


module.exports = {generateApplicationEmail,generateApplicationEmail2}

