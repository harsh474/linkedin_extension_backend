require('dotenv').config();
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const prompts = require('./prompts'); // Import the prompts



const YOUR_API_KEY = process.env.GEMNI_API_KEY;
const genAI = new GoogleGenerativeAI(YOUR_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
// --- Email Generation Function (using imported prompts) ---
async function generateApplicationEmail(jobDescription, applicantData) {
    try {


        // Step 1: Extract Job and Company Information
        const jobResult = await model.generateContent(prompts.promptStep1(jobDescription));
        let jobInfoString = jobResult.response.candidates[0].content.parts[0].text; 
        jobInfoString  = jobInfoString.replace(/```json\n?/, '').replace(/```/, '')  // removes the opening ```json (with optional newline)     // removes the closing ```
        const jobInfo = JSON.parse(jobInfoString);



        // Step 2: Extract Applicant Information
        const applicantResult = await model.generateContent(prompts.promptStep2(applicantData, jobInfo));
        let applicantInfoString = applicantResult.response.candidates[0].content.parts[0].text; 
        applicantInfoString  = applicantInfoString.replace(/```json\n?/, '').replace(/```/, '')  // removes the opening ```json (with optional newline)     // removes the closing ```
        const applicantInfo = JSON.parse(applicantInfoString);
        console.log("applicantInfo\n",applicantInfo) 



        // Step 3: Determine Subject Line
        const subjectResult = await model.generateContent(prompts.promptStep3(jobInfo));
        const subject = subjectResult.response.candidates[0].content.parts[0].text.trim().replace(/"/g, '');

        // Step 4: Craft Opening
        const openingResult = await model.generateContent(prompts.promptStep4(jobInfo, applicantInfo));
        const opening = openingResult.response.candidates[0].content.parts[0].text.trim();

        // Step 5: Highlight Skills and Experience (Incorporating Company Type Guess)
        const skillsResult = await model.generateContent(prompts.promptStep5(jobInfo, applicantInfo));
        const skillsHighlight = skillsResult.response.candidates[0].content.parts[0].text.trim();

        // Step 6: Address Requirements
        const requirementsResult = await model.generateContent(prompts.promptStep6(jobInfo, applicantInfo));
        const requirementsAddress = requirementsResult.response.candidates[0].content.parts[0].text.trim();

        // Step 7: Craft Closing
        const closingResult = await model.generateContent(prompts.promptStep7(applicantInfo));
        const closing = closingResult.response.candidates[0].content.parts[0].text.trim();

        // Assemble Email Body
        let emailBody = `<span class="math-inline">\{opening\}\\n\\n</span>{skillsHighlight}\n\n${requirementsAddress}\n\n${closing}\n\nSincerely,\n${applicantInfo.name}\n📞 ${applicantInfo.phone}\n✉️ ${applicantInfo.email}`;

        // Step 10: Refine Tone Based on Company Type Guess
        const toneRefinementResult = await model.generateContent(prompts.promptStep10(jobInfo.companyTypeGuess, emailBody));
        const toneRefinement = toneRefinementResult.response.candidates[0].content.parts[0].text.trim();

        if (toneRefinement && toneRefinement.toLowerCase() !== "no revisions needed.") {
            emailBody += `\n\n${toneRefinement}`;
        }

        return { subject: subject, emailBody: emailBody };

    } catch (error) {
        console.error("Error generating email:", error);
        return { subject: "Error Generating Subject", emailBody: "An error occurred while generating the email." };
    }
}


module.exports = {generateApplicationEmail}

