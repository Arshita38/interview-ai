const { GoogleGenAI, Type } = require("@google/genai");

const ai = process.env.GOOGLE_GENAI_API_KEY ? new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
}) : null;

// ==========================================
// 1. NATIVE GEMINI API SCHEMAS
// ==========================================

const questionSchemaStructure = {
    type: Type.OBJECT,
    properties: {
        question: { type: Type.STRING, description: "The exact interview question text." },
        intention: { type: Type.STRING, description: "The intention or logic behind why the interviewer asks this question." },
        answer: { type: Type.STRING, description: "A detailed, step-by-step sample answer guiding the candidate on what points to highlight." }
    },
    required: ["question", "intention", "answer"]
};

const interviewReportNativeSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "The target job role or title name." },
        matchScore: { type: Type.INTEGER, description: "An integer score from 0 to 100 mapping candidate profile match." },
        technicalQuestions: {
            type: Type.ARRAY,
            items: questionSchemaStructure,
            description: "A comprehensive list containing at least 5 distinct technical question objects."
        },
        behavioralQuestions: {
            type: Type.ARRAY,
            items: questionSchemaStructure,
            description: "A comprehensive list containing at least 5 distinct behavioral question objects."
        },
        skillGaps: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    skill: { type: Type.STRING, description: "The specific domain skill missing." },
                    severity: { type: Type.STRING, enum: ["low", "medium", "high"], description: "The gap severity layer level." }
                },
                required: ["skill", "severity"]
            },
            description: "List of identified candidate profile gaps."
        },
        preparationPlan: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    day: { type: Type.INTEGER, description: "Sequential preparation day timeline index number starting from 1." },
                    focus: { type: Type.STRING, description: "Core domain theme target to focus on for this specific day." },
                    tasks: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "Actionable study or execution tasks list."
                    }
                },
                required: ["day", "focus", "tasks"]
            },
            description: "A day-by-day customized sequence roadmap plan."
        }
    },
    required: ["title", "matchScore", "technicalQuestions", "behavioralQuestions", "skillGaps", "preparationPlan"]
};

// ==========================================
// 2. HELPER FUNCTIONS
// ==========================================

const html_to_pdf = require("html-pdf-node");

const generatePdfFromHtml = async (htmlContent) => {
  try {
    const options = {
      format: "A4",
      printBackground: true,
    };

    const file = { content: htmlContent };

    const pdfBuffer = await html_to_pdf.generatePdf(file, options);

    return pdfBuffer;

  } catch (error) {
    console.error("❌ HTML → PDF Error:", error);
    throw error;
  }
};

// ==========================================
// 3. CORE EXPORTED SERVICES
// ==========================================

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    if (!ai) {
        throw new Error("AI service not initialized. Please check GOOGLE_GENAI_API_KEY.");
    }

    let resumeText = "";
    if (typeof resume === 'string') {
        resumeText = resume;
    } else if (resume && resume.buffer) {
        resumeText = resume.buffer.toString('utf-8');
    } else if (resume) {
        resumeText = JSON.stringify(resume);
    }

    const prompt = `You are an elite Tech Lead and Interviewer Panel. Analyze the input parameters below and formulate a comprehensive structural assessment report.
    
    CRITICAL MANDATE:
    You must populate multiple distinct entries inside "technicalQuestions" and "behavioralQuestions". 
    Each entry must be a separate object containing separate properties for "question", "intention", and "answer". Do not dump strings or concatenate arrays.

    Inputs:
    - Candidate Resume Profile: ${resumeText}
    - Candidate Personal Profile: ${selfDescription}
    - Target Position Requirement: ${jobDescription}`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: interviewReportNativeSchema // Uses the strict Native SDK Type schema directly
        }
    })

    return JSON.parse(response.text);
}

const generateResumePdf = async ({ report, resume, selfDescription, jobDescription }) => {
  try {
    if (!ai) throw new Error("AI not initialized");

    console.log("🚀 Generating REAL resume with user data...");

    // ✅ DEBUG (VERY IMPORTANT)
    console.log("==== INPUT DEBUG ====");
    console.log("RESUME:", resume?.slice(0, 200));
    console.log("SELF DESC:", selfDescription);
    console.log("JOB DESC:", jobDescription);
    console.log("====================");

    const prompt = `
You are a Top 1% ATS Resume Writer.

⚠️ STRICT RULES:
- You MUST ONLY use the data provided below
- DO NOT generate generic or template content
- DO NOT assume anything
- DO NOT add fake projects/experience
- If something is missing, leave it empty

========================
INPUT DATA
========================

ORIGINAL RESUME:
${resume}

SELF DESCRIPTION:
${selfDescription}

JOB DESCRIPTION:
${jobDescription}

INTERVIEW REPORT:
${typeof report === "string" ? report : JSON.stringify(report)}

========================
TASK
========================

Generate a highly professional, ATS-optimized resume JSON.

GUIDELINES:
- Extract REAL details from ORIGINAL RESUME
- Enhance using SELF DESCRIPTION
- Align skills with JOB DESCRIPTION
- Use INTERVIEW REPORT only for improvements
- DO NOT fabricate anything

OUTPUT FORMAT (STRICT JSON ONLY):

{
  "name": "",
  "title": "Software Engineer",
  "email": "",
  "phone": "",
  "location": "",
  "links": {
    "linkedin": "",
    "github": ""
  },
  "summary": "",
  "skills": {
    "technical": [],
    "tools": [],
    "concepts": []
  },
  "projects": [
    {
      "name": "",
      "technologies": [],
      "duration": "",
      "points": []
    }
  ],
  "experience": [
    {
      "company": "",
      "role": "",
      "duration": "",
      "location": "",
      "points": []
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "duration": "",
      "location": ""
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.1
      }
    });

    const text =
      typeof response.text === "function"
        ? await response.text()
        : response.text;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("❌ JSON not found in AI response");

    const data = JSON.parse(jsonMatch[0]);

    // ✅ Contact formatting
    const contactInfo = [
      data.email,
      data.phone,
      data.location,
      data.links?.linkedin,
      data.links?.github
    ]
      .filter(val => val && val.trim() !== "")
      .join(" &nbsp;|&nbsp; ");

    // ✅ HTML TEMPLATE (UNCHANGED DESIGN)
    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {
    font-family: Arial, Helvetica, sans-serif;
    color: #222;
    line-height: 1.45;
    padding: 40px;
    font-size: 13px;
  }
  h1 {
    text-align: center;
    font-size: 24px;
    margin-bottom: 2px;
    text-transform: uppercase;
  }
  .title {
    text-align: center;
    font-size: 13px;
    font-weight: bold;
    color: #555;
    margin-bottom: 4px;
  }
  .contact {
    text-align: center;
    font-size: 12px;
    color: #666;
    margin-bottom: 15px;
  }
  h2 {
    font-size: 13px;
    border-bottom: 1.5px solid #222;
    margin: 16px 0 6px;
    text-transform: uppercase;
  }
  ul {
    margin-left: 18px;
  }
  li {
    margin-bottom: 3px;
  }
</style>
</head>
<body>

<h1>${data.name || "Candidate Name"}</h1>
<div class="title">${data.title || "Software Engineer"}</div>

${contactInfo ? `<div class="contact">${contactInfo}</div>` : ""}

${data.summary ? `<h2>Summary</h2><p>${data.summary}</p>` : ""}

<h2>Skills</h2>
${data.skills?.technical?.length ? `<p><strong>Technical:</strong> ${data.skills.technical.join(", ")}</p>` : ""}
${data.skills?.tools?.length ? `<p><strong>Tools:</strong> ${data.skills.tools.join(", ")}</p>` : ""}
${data.skills?.concepts?.length ? `<p><strong>Concepts:</strong> ${data.skills.concepts.join(", ")}</p>` : ""}

${data.projects?.length ? `
<h2>Projects</h2>
${data.projects.map(p => `
  <p><strong>${p.name}</strong> (${p.duration || ""})</p>
  <p>${p.technologies?.join(", ") || ""}</p>
  <ul>${(p.points || []).map(pt => `<li>${pt}</li>`).join("")}</ul>
`).join("")}
` : ""}

${data.experience?.length ? `
<h2>Experience</h2>
${data.experience.map(e => `
  <p><strong>${e.role} — ${e.company}</strong></p>
  <ul>${(e.points || []).map(pt => `<li>${pt}</li>`).join("")}</ul>
`).join("")}
` : ""}

${data.education?.length ? `
<h2>Education</h2>
${data.education.map(ed => `
  <p><strong>${ed.degree}</strong> — ${ed.institution}</p>
`).join("")}
` : ""}

</body>
</html>
`;

    const pdfBuffer = await generatePdfFromHtml(html);
    return pdfBuffer;

  } catch (error) {
    console.error("❌ Resume PDF Error:", error);
    return null;
  }
};
module.exports = {
    generateInterviewReport,
    generateResumePdf
};