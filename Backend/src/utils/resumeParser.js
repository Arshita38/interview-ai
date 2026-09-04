const pdfParseModule = require("pdf-parse");
const mammoth = require("mammoth");

async function extractResumeText(file) {
    try {
        if (!file || !file.buffer) {
            console.log("No file buffer received");
            return "";
        }

        let text = "";

     

        // PDF
        if (file.mimetype === "application/pdf") {

            // Handles newer pdf-parse versions
            const PDFParse =
                pdfParseModule.PDFParse ||
                pdfParseModule.default ||
                pdfParseModule;

            const parser = new PDFParse({
                data: file.buffer
            });

            const result = await parser.getText();

            text = result.text;

            await parser.destroy();
        }

        // DOCX
        else if (
            file.mimetype ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
            const result = await mammoth.extractRawText({
                buffer: file.buffer
            });

            text = result.value;
        }

        else {
            throw new Error("Unsupported file type");
        }


       
    


        return text ? text.trim() : "";

    } catch (error) {
        console.error("Resume extraction failed:", error);
        return "";
    }
}

module.exports = { extractResumeText };