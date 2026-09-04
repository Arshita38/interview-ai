import { 
    getAllInterviewReports, 
    generateInterviewReport, 
    getInterviewReportById, 
    generateResumePdf 
} from "../services/interview.api";
import { useContext, useEffect } from "react";
import { InterviewContext } from "../interview.context";
import { useParams } from "react-router";

export const useInterview = () => {
    const context = useContext(InterviewContext);
    const { interviewId } = useParams();

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider");
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context;

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
    setLoading(true);
    try {
        const response = await generateInterviewReport({
            jobDescription,
            selfDescription,
            resumeFile,
        });

        console.log("Interview API Response:", response);

        // Backend returns the report directly
        setReport(response);
        return response;

    } catch (error) {
        console.log(error);
        throw error;
    } finally {
        setLoading(false);
    }
};

    const getReportById = async (id) => {
        setLoading(true);
        try {
            const response = await getInterviewReportById(id);
            if (response?.interviewReport) {
                setReport(response.interviewReport);
                return response.interviewReport;
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
        return null;
    };

    const getReports = async () => {
        setLoading(true);
        try {
            const response = await getAllInterviewReports();
            setReports(response?.interviewReports || []);
            return response?.interviewReports || [];
        } catch (error) {
            console.log(error);
            setReports([]);
            return [];
        } finally {
            setLoading(false);
        }
    };

const getResumePdf = async (reportData) => {
  console.log("Raw reportData received:", reportData);

  setLoading(true);

  try {
    const reportId = reportData?._id;

    if (!reportId) {
      console.error("Invalid report ID:", reportData);
      alert("Invalid report data");
      return;
    }

    console.log("Sending ID:", reportId);

    const response = await generateResumePdf(reportId);

    const url = window.URL.createObjectURL(
      new Blob([response], { type: "application/pdf" })
    );

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Resume.pdf");

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error("Failed to download PDF:", error);
    alert("Could not generate the PDF. Please try again.");
  } finally {
    setLoading(false);
  }
};

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            return;
        }

        if (interviewId) {
            getReportById(interviewId);
        } else {
            getReports();
        }
    }, [interviewId]);

    return { 
        loading, 
        report, 
        reports, 
        generateReport, 
        getReportById, 
        getReports, 
        getResumePdf 
    };
};




