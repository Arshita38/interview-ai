const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")
const { extractResumeText } = require("../utils/resumeParser")
const aiService = require("../services/ai.service")



/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */

const generateInterViewReportController = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Please upload a resume file." });
        }

        // 1. Extract the raw text out of the uploaded PDF/Docx file
        const parsedResumeText = await extractResumeText(req.file);
  

        // 2. Pass clean text strings to your AI generation service layer
        const aiGeneratedContent = await aiService.generateInterviewReport({
            resume: parsedResumeText,
            selfDescription: req.body.selfDescription || "",
            jobDescription: req.body.jobDescription || "",
        });

        // 3. CRITICAL: Save everything into the database so it exists for downloads later
        const newInterviewReport = new interviewReportModel({
            user: req.user.id, // Binds the report to the logged-in user
            resume: parsedResumeText,
            jobDescription: req.body.jobDescription || "",
            selfDescription: req.body.selfDescription || "",
            
            // Spread the rest of the AI layout metrics (questions, roadmap, matchScore, etc.)
            ...aiGeneratedContent 
        });

        await newInterviewReport.save();

        // 4. Return the saved document (including its new _id) to the frontend
        return res.status(201).json(newInterviewReport);

    } catch (error) {
        console.error("Controller Error:", error);
        const statusCode = error.status || 500;
        return res.status(statusCode).json({
            message: error.message || "An error occurred while generating the report.",
        });
    }
};




/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {
    try {
        const { interviewId } = req.params;

        // 1. Intercept 'new' so it doesn't query the database and crash
        if (interviewId === 'new' || interviewId === '[object Object]') {
            return res.status(200).json({
                message: "Ready to create a new report.",
                interviewReport: null
            });
        }

        // 2. Your exact database query logic
        const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id });

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            });
        }

        return res.status(200).json({
            message: "Interview report fetched successfully.",
            interviewReport
        });

    } catch (error) {
        console.error("Controller Error:", error);
        const statusCode = error.status || 500;
        return res.status(statusCode).json({
            message: error.message || "An error occurred while generating the report.",
        });
    }
}


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {

    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
const generateResumePdfController = async (req, res) => {
  try {
    const { interviewReportId: id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: "NO_ID",
        message: "Interview Report ID is required",
      });
    }

    const reportDoc = await interviewReportModel.findById(id);

    if (!reportDoc) {
      return res.status(404).json({
        error: "NOT_FOUND",
        message: "Report not found",
      });
    }

    // ✅ Extract required fields from DB
    const report = reportDoc.report || reportDoc; 
    const resume = reportDoc.resume || ""; 
    const selfDescription = reportDoc.selfDescription || "";
    const jobDescription = reportDoc.jobDescription || "";

    // ✅ DEBUG (don’t skip this)
    console.log("==== CONTROLLER DEBUG ====");
    console.log("resume exists:", !!resume);
    console.log("selfDescription:", selfDescription);
    console.log("jobDescription:", jobDescription);
    console.log("==========================");

    // ✅ PASS FULL DATA
    const pdfBuffer = await generateResumePdf({
      report,
      resume,
      selfDescription,
      jobDescription
    });

    if (!pdfBuffer) {
      return res.status(500).json({
        error: "PDF_BUFFER_NULL",
        message: "PDF generation failed",
      });
    }

    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": pdfBuffer.length,
      "Content-Disposition": `attachment; filename=resume.pdf`,
    });

    return res.end(pdfBuffer);

  } catch (error) {
    console.error("PDF Production Error:", error);
    return res.status(500).json({
      error: "GLOBAL_CONTROLLER_CATCH",
      message: error.message,
    });
  }
};

module.exports = {
    generateInterViewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    generateResumePdfController
};