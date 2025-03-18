const { GoogleGenerativeAI } = require("@google/generative-ai");
const { response } = require("express");
const dotenv = require('dotenv');
dotenv.config();
const YOUR_API_KEY = process.env.GEMNI_API_KEY;
const genAI = new GoogleGenerativeAI(YOUR_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const { usercollection } = require('./db');

const content = `
Ritika KherataRitika Kherata
 • 1st • 1st
IT Recruiter @CARS24 | HR Professional | MBA-HRIT Recruiter @CARS24 | HR Professional | MBA-HR
1w • Edited •  1 week ago

🎉 We're Hiring! Software Interns in Gurgaon 🎉

CARS24 is committed to excellence and innovation. Our team is our greatest asset, and we are excited to welcome experienced talent to our growing family. If you're passionate, ambitious, and ready to make a real impact, we want to hear from you! 🚀

What We Offer:
🌱 Professional Growth: Continuous learning and development opportunities.
🚀 Career Advancement: Clear pathways for career progression within a thriving company.
🤝 Collaborative Environment: Work alongside industry experts in a supportive and dynamic team.
🌍 Networking: Connect with industry leaders and participate in exclusive 
events.

Position: Software intern
Location: Gurgaon
Skills: React Native, JavaScript, Redux, REST APIs, Mobile App Architecture, Performance Optimization, UI/UX Design
Notice Period: Immediate

To apply, share your resume at ritika.kherata@cars24.com in the format below:
Subject Line: Software Intern- Gurgaon
Notice Period:
Current Location:
Open to relocate to Gurgaon: yes/no

Let’s build the future together! 

write to email to apply this position 
` ;

let result, applicantdata, extracted_text, jobDetails, Applicant_information, currentcount, maxxcount, emailResult, emailText,emailTemplate;

const extractJobDetails = async () => {
    try {
        result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `Analyze the job post below and extract the following details as JSON:
                         1. Recruiter name: "recruiter_name"
                         2. Experience requirement: "experience"
                         3. Email to apply: "email"
                         4. Job title: "job_title"
                         5. Job ID (if available): "job_id"
                         6. Company name: "company"
                         7. Email subject: Suggested subject for applying (e.g., "Application for Software Intern")
 
                         If any information is missing in the post, use 'N/A'. Ensure the response is a clean JSON object.`
                        },
                        { text: `Provide the output strictly as a JSON object without any additional text, formatting, or explanations. Here is the job post: ${content}` }
                    ]
                }
            ]
        });

        try {
            applicantdata = await usercollection.findOne({ email: "harshrajput1101@gmail.com" });
        } catch (error) {
            console.log(error);
        }

        currentcount = applicantdata.currentcount;
        maxxcount = applicantdata.maxxcount;

        if (currentcount >= maxxcount) {
            return res.status(501).json({ "message": "You have hit your current limit. Please Upgrade!" });
        }

        Applicant_information = {
            name: applicantdata.name || 'N/A',
            resumeLink: applicantdata.Resume || 'N/A',
            institution: applicantdata.institution || 'N/A',
            graduationYear: applicantdata.graduationYear || 'N/A',
            companyName: applicantdata.companyName || 'N/A',
            role: applicantdata.role || 'N/A',
            experienceDescription: applicantdata.experienceDescription || 'N/A',
            github: applicantdata.GitHub || 'N/A',
            linkedin: applicantdata.LinkedIn || 'N/A',
            email: applicantdata.email || 'N/A'
        };

        // Remove Markdown code block formatting  
        extracted_text = result.response.text();
        extracted_text = extracted_text.replace(/```json\n|```/g, '').trim();


        try {
            jobDetails = await JSON.parse(extracted_text);

        } catch (error) {
            console.log("error", error)
        }
        // Generate a professional email using the extracted details
        const emailResult = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: `I have provided applicant details as follows: ${JSON.stringify(applicantdata)}. Use this information to craft the email.` },
                        {
                            text: `Write a professional and well-structured job application email based on the extracted details:
                                - Recipient: ${jobDetails.email}
                                - Subject: ${jobDetails.email_subject}
                                - Salutation: Address the recruiter professionally.
                                - Introduction: Express interest in the Software Intern role at ${jobDetails.company}.
                                - Skills & Experience: Briefly highlight relevant skills and experience from the applicant’s background.
                                - Alignment: Explain how the applicant’s experience aligns with the job role.
                                - Closing: Thank the recruiter, mention the attached resume, and express eagerness for a response.
        
                                Ensure the email includes:
                                - Applicant’s full name: ${applicantdata.name}
                                - Applicant’s email: ${applicantdata.email}
                                - Applicant’s degree: ${applicantdata.degree}
                                - Institution: ${applicantdata.institution}
                                - Graduation year: ${applicantdata.graduationYear}
                                - Work experience summary: ${applicantdata.experienceDescription}
                                - GitHub profile: ${applicantdata.GitHub}
                                - LinkedIn profile: ${applicantdata.LinkedIn}
                                - Resume link: ${applicantdata.Resume}
        
                                The email should be concise, professional, and formatted correctly.`
                        }
                    ]
                }
            ]
        });
        

        // Get the generated email text
        emailText = emailResult.response.text();
        emailTemplate = {
            "To": jobDetails.email,
            "Subject": jobDetails.email_subject,
            "Body": `Dear ${jobDetails.recruiter_name !== "N/A" ? jobDetails.recruiter_name : "Hiring Manager"},\n\n` +
                `I am writing to express my interest in the ${jobDetails.job_title || "open position"} at ${jobDetails.company || "your company"}. ` +
                `With my experience in ${Applicant_information.experienceDescription || "the relevant field"}, I believe I am a strong candidate for this role.\n\n` +
                `Please find my resume attached for your consideration. I look forward to discussing how my skills and experiences align with the needs of your team.\n\n` +
                `Thank you for your time and consideration.\n\n` +
                `Best regards,\n${Applicant_information.name}\n` +
                `Email: ${Applicant_information.email}\nGitHub: ${Applicant_information.github}\nLinkedIn: ${Applicant_information.linkedin}\nResume: ${Applicant_information.resumeLink}`
        };
       
        console.log("extract",emailText)
        
       
    } catch (error) {
        console.error("Error:", error);
    }
};

extractJobDetails();
