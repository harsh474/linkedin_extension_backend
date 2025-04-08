
// --- Modified Prompt Functions (Extract Company Info from Job Description) ---

const promptStep1 = (jobDescription) => `You are an expert in analyzing job descriptions. Please read the following job posting and identify the key information, specifically:


require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getModel({ model: "gemini-pro");

* The job title.
* The location of the job.
* The essential skills and technologies mentioned (list them as keywords).
* Any explicitly stated requirements (e.g., notice period requirement: "Immediate", relocation requirement: "Open to relocate to [Job Location]: yes/no"). Return these as key-value pairs.
* The email address to send the application to.
* The format for the subject line (if specified).
* The name of the company that is hiring.
* Based on the language and information in the job posting (e.g., mentions of innovation, rapid growth, established history, client services), infer the type of company (e.g., startup, MNC, established company, service-based company). Provide a concise guess.

Job Posting:
\`\`\`
${jobDescription}
\`\`\`

Respond with a JSON object containing the extracted information with the following keys: "jobTitle", "location", "skills", "requirements", "applicationEmail", "subjectLineFormat", "companyName", "companyTypeGuess".`;

const promptStep2 = (applicantData, jobInfo) => `You are an expert in analyzing applicant profiles. Please read the following applicant data and extract the information that could be relevant for given job requirments as .

Applicant Data:
\`\`\`json
${JSON.stringify(applicantData)}
\`\`\`

Jobdetails Data:
\`\`\`json
${JSON.stringify(jobInfo)}
\`\`\`

Identify and return the following in a JSON object:

* "name": The applicant's full name.
* "email": The applicant's email address.
* "phone": The applicant's phone number.
* "technicalSkills": List any technical skills mentioned or implied in their education or experience (e.g., from role descriptions, fields of study).
* "relevantExperience": Summarize any work experience that might be relevant, even if not directly in software (focus on transferable skills like analysis, problem-solving, teamwork). Include company name, role, and a very brief description if available and return in the form of array of objects .
* "education": List the applicant's educational qualifications (degree, field of study) in the form of array of objects.
* "currentLocation": Based on the provided data, what is the applicant's likely current location? (Consider the location of their most recent 'currently working' experience. If not clear, indicate "Location unclear").
* "willingToRelocate": (Infer willingness to relocate to "${jobInfo.jobLocation}" based on the job description's implied need and the applicant's potential interest in the role. Default to "Yes" if the job is in a specific location and the applicant's current location is different. If the job doesn't specify a strong location preference or the applicant's location matches, default to "Considering". If explicitly stated in applicantData, use that. If completely unknown, use "Potentially").
* "noticePeriod": (Infer notice period based on their current employment status. If 'currently_working' is true and 'to' date is empty, assume they might have a standard notice period. If 'currently_working' is false or a 'to' date is in the past, assume "Immediate" or "Negotiable". Be conservative if unsure and return "Potentially").`;

const promptStep3 = (jobDescription,jobInfo) => `Based on the following job Describtion ,applicant want to apply to  job in the jobdescribtion ,so write subject of email like Apllication for Software developer-Job  id(if avialable) ,applicant will send  as job application?

Job description:
\`\`\`json
${JSON.stringify(jobDescription)}
\`\`\`
`;

const promptStep4 = (jobInfo, applicantInfo) => `Write a professional and concise opening sentence for a job application email. The applicant's name is "${applicantInfo.name}" and they are applying for the position of "${jobInfo.jobTitle}" at "${jobInfo.companyName}" in "${jobInfo.location}". Address the email to the recruiter mentioned in the job posting ("${jobInfo.applicationEmail.split('@')[0].split('.').join(' ').split(' ')[0].charAt(0).toUpperCase() + jobInfo.applicationEmail.split('@')[0].split('.').join(' ').split(' ').slice(1).join(' ')}" - try to extract the first name).`;

const promptStep5 = (jobInfo, applicantInfo) => `Given the essential skills for the "${jobInfo.jobTitle}" role at ${jobInfo.companyName} (keywords: ${jobInfo.skills.join(', ')}) and the applicant "${applicantInfo.name}'s" background with education in "${applicantInfo.education.map(edu => edu.qualification + (edu.field_of_study ? ' (' + edu.field_of_study + ')' : '')).join(', ')}" and relevant experience in "${applicantInfo.relevantExperience.map(exp => exp.role + ' at ' + exp.company).join(', ')}", and knowing that ${jobInfo.companyName} is likely a "${jobInfo.companyTypeGuess}", write 2-3 concise sentences that:

* Express the applicant's strong interest in the "${jobInfo.jobTitle}" role at ${jobInfo.companyName}$.
* Highlight any transferable skills from their background that could be beneficial in a software development environment (e.g., analytical skills from finance, problem-solving from analysis).
* Acknowledge the required technical skills and express their enthusiasm and willingness to learn and contribute in these areas, potentially mentioning their interest in the type of company (e.g., innovation in a startup, stability in an MNC).`;

const promptStep6 = (jobInfo, applicantInfo) => `The job posting for the "${jobInfo.jobTitle}" position at ${jobInfo.companyNamejob} in ${jobInfo.location} has the following requirements: ${Object.entries(jobInfo.requirements).map(([key, value]) => `${key}: ${value}`).join(', ')}.

Based on the applicant "${applicantInfo.name}'s" information:
* Current Location: ${applicantInfo.currentLocation}
* Willingness to Relocate to ${jobInfo.location}: ${applicantInfo.willingToRelocate || "unknown"}
* Notice Period: ${applicantInfo.noticePeriod || "Unclear"}

Write one concise sentence that addresses these points professionally. Only include information if it was explicitly mentioned or inferred in the previous steps.`;

const promptStep7 = (applicantInfo) => `Write a professional closing sentence and a brief call to action for a job application email from "${applicantInfo.name}". Assume their resume is attached.`;

const promptStep10 = (companyTypeGuess, currentEmailBody) => `Given that the company is likely a "${companyTypeGuess}", review the following draft of a job application email and suggest 1-2 minor revisions to the language to better align with the typical tone of such a company. If the tone seems appropriate, you can say "No revisions needed."

Email Body:
\`\`\`
${currentEmailBody}
\`\`\`

Focus on aspects like formality, enthusiasm, emphasis on innovation (for startups), stability (for MNCs), or client focus (for service-based companies). Return only the suggested revisions or "No revisions needed."`;

const promptStep11 = (jobDescription, applicantData) => ` Analyze jobDescription this job Description ${jobDescription} is about job posted by hr/employee/founder of that company and asking asking applicant to apply on the given email given in the Job Description, in the email it's must to include to company for which we are applying and name of recruiter which is given in ${jobDescription}
jobDescription:
\`\`\`
${ jobDescription }
\`\`\` 
In the applicantData all the user information is there like name,email,phone,eductions ,experiences 
applicantData:
\`\`\`
${ applicantData }
\`\`\`
"\nNote: Do not include the subject line in the body of the email.";
Note : 1. Subject of mail is not require 
       2. Only require  response of mail body 
       2.Use points or bullets in experience
       3.Do't include thing, if not have any information about it 
       4.IF consist of multiple jobs requirement then rollout others jobs, which  do't match with experience  ${applicantData.experiences} and skills of  ${applicantData.skills} 
Prepare email body heighligthing about applicant ${applicantData} eductions, skills, experience and resumelink ${applicantData.resumelink} of applicant (all thes infomration is in applicantData ) ,  
Prepare different section for each and heighlight how applicantis suitable for this job role 
also include personal information of applicant in the last of emailbody. 
     5. Return response as json body 
     6.Response include email of recuiter to which we have to send mail or apply, field_name of json is  "To" and
     7.Response include subject of email which we created acoording to match job  , field name of json "subject" and
     8.Response include  body of mail ,  , field name of json "body" 
     9.source of advertisement is not required like  "as advertised on [Platform where you saw the advertisement -  if known]|| linkedin is not required"
     10.Do't add explicitly Personal detail section, after thanks  add all applicant personal information like name,email,Phone,Github,Linkdin,ResumeLink link is ${applicantData.resumelink}. If any field is not present in this do't add in final result
     12. Don't include anything if not known 
     13.If company name is not given then extract from the recruiter email 
"`;




module.exports = {
     promptStep1,
     promptStep2,
     promptStep3,
     promptStep4,
     promptStep5,
     promptStep6,
     promptStep7,
     promptStep10,
     promptStep11,
 };