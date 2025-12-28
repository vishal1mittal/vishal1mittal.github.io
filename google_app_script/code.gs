// =====================================================
// Cambridge Computer Education - Form Submission Handler
// =====================================================
//
// SETUP INSTRUCTIONS:
// 1. Open Google Sheets
// 2. Extensions > Apps Script
// 3. Paste this code, replacing any existing code
// 4. Run setup() function once (authorize when prompted)
// 5. Deploy > New Deployment > Web App
//    - Execute as: Me
//    - Who has access: Anyone
// 6. Copy the Web App URL
// 7. Update SCRIPT_URL in js/form-handler.js with this URL
//
// OWNER EMAIL CONFIGURATION:
// Replace YOUR_EMAIL_HERE with your actual email address
// =====================================================

const OWNER_EMAIL = "info@cambridgecomputereducation.in"; // CHANGE THIS!

// Sheet names for different form types
const SHEETS = {
	contact_general: "Contact_General",
	admissions: "Admissions",
	demo_request: "Demo_Requests",
};

/**
 * Setup function - Run this ONCE to create all sheets
 */
function setup() {
	const doc = SpreadsheetApp.getActiveSpreadsheet();

	// Create Contact_General sheet
	createSheetIfNotExists(doc, SHEETS.contact_general, [
		"Timestamp",
		"Form Type",
		"Name",
		"Email",
		"Phone",
		"Course",
		"Message",
		"Page Source",
		"User Agent",
		"Status",
	]);

	// Create Admissions sheet
	createSheetIfNotExists(doc, SHEETS.admissions, [
		"Timestamp",
		"Form Type",
		"First Name",
		"Last Name",
		"Email",
		"Phone",
		"Course",
		"Page Source",
		"User Agent",
		"Status",
	]);

	// Create Demo_Requests sheet
	createSheetIfNotExists(doc, SHEETS.demo_request, [
		"Timestamp",
		"Form Type",
		"Name",
		"Email",
		"Phone",
		"Course",
		"Page Source",
		"User Agent",
		"Status",
	]);

	Logger.log("Setup complete! All sheets created.");
}

/**
 * Helper: Create sheet if it doesn't exist
 */
function createSheetIfNotExists(doc, sheetName, headers) {
	let sheet = doc.getSheetByName(sheetName);
	if (!sheet) {
		sheet = doc.insertSheet(sheetName);
		sheet.appendRow(headers);

		// Format header row
		const headerRange = sheet.getRange(1, 1, 1, headers.length);
		headerRange.setBackground("#2563eb");
		headerRange.setFontColor("#ffffff");
		headerRange.setFontWeight("bold");
		headerRange.setHorizontalAlignment("center");

		// Freeze header row
		sheet.setFrozenRows(1);

		Logger.log(`Created sheet: ${sheetName}`);
	}
}

/**
 * Main POST handler - receives form submissions
 */
function doPost(e) {
	const lock = LockService.getScriptLock();

	try {
		// Try to acquire lock (wait up to 10 seconds)
		lock.tryLock(10000);

		if (!lock.hasLock()) {
			return createErrorResponse("Server busy. Please try again.");
		}

		const data = e.parameter;
		const formType = data.formType || "contact_general";

		// Validate form type
		if (!SHEETS[formType]) {
			return createErrorResponse("Invalid form type");
		}

		// Get the appropriate sheet
		const doc = SpreadsheetApp.getActiveSpreadsheet();
		const sheet = doc.getSheetByName(SHEETS[formType]);

		if (!sheet) {
			return createErrorResponse("Sheet not found. Please run setup()");
		}

		// Prepare row data based on form type
		const rowData = prepareRowData(formType, data);

		// Append to sheet
		sheet.appendRow(rowData);

		// Send email notification to owner
		sendEmailNotification(formType, data, sheet);

		// Return success
		return createSuccessResponse({
			message: "Form submitted successfully!",
			formType: formType,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		Logger.log("Error in doPost: " + error.toString());
		return createErrorResponse(error.toString());
	} finally {
		// Always release the lock
		lock.releaseLock();
	}
}

/**
 * Prepare row data based on form type
 */
function prepareRowData(formType, data) {
	const timestamp = new Date();
	const pageSource = data.pageSource || "Unknown";
	const userAgent = data.userAgent || "Unknown";

	switch (formType) {
		case "contact_general":
			return [
				timestamp,
				formType,
				data.name || "",
				data.email || "",
				data.phone || "",
				data.course || "",
				data.message || "",
				pageSource,
				userAgent,
				"New",
			];

		case "admissions":
			return [
				timestamp,
				formType,
				data.firstName || "",
				data.lastName || "",
				data.email || "",
				data.phone || "",
				data.course || "",
				pageSource,
				userAgent,
				"New",
			];

		case "demo_request":
			return [
				timestamp,
				formType,
				data.name || "",
				data.email || "",
				data.phone || "",
				data.course || "",
				pageSource,
				userAgent,
				"New",
			];

		default:
			return [timestamp, formType, JSON.stringify(data)];
	}
}

/**
 * Send email notification to owner
 */
function sendEmailNotification(formType, data, sheet) {
	try {
		const sheetUrl = SpreadsheetApp.getActiveSpreadsheet().getUrl();
		const formTypeLabel = formatFormType(formType);

		// Email subject
		const subject = `🔔 New ${formTypeLabel} Submission - Cambridge`;

		// Email body
		let body = `You have received a new ${formTypeLabel} submission:\n\n`;
		body += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
		body += `SUBMISSION DETAILS\n`;
		body += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

		// Add form-specific fields
		for (const key in data) {
			if (
				key !== "formType" &&
				key !== "pageSource" &&
				key !== "userAgent"
			) {
				const label =
					key.charAt(0).toUpperCase() +
					key.slice(1).replace(/([A-Z])/g, " $1");
				body += `${label}: ${data[key]}\n`;
			}
		}

		body += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
		body += `METADATA\n`;
		body += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
		body += `Form Type: ${formTypeLabel}\n`;
		body += `Page Source: ${data.pageSource || "Unknown"}\n`;
		body += `Submitted: ${new Date().toLocaleString("en-IN", {
			timeZone: "Asia/Kolkata",
		})}\n`;
		body += `User Agent: ${(data.userAgent || "Unknown").substring(
			0,
			100,
		)}...\n\n`;

		body += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
		body += `📊 View in Google Sheets:\n${sheetUrl}\n\n`;
		body += `⚡ This is an automated notification from your website form system.\n`;

		// Send email
		MailApp.sendEmail({
			to: OWNER_EMAIL,
			subject: subject,
			body: body,
		});

		Logger.log(`Email sent to ${OWNER_EMAIL} for ${formType}`);
	} catch (error) {
		Logger.log("Error sending email: " + error.toString());
		// Don't throw - we still want the form submission to succeed
	}
}

/**
 * Format form type for display
 */
function formatFormType(formType) {
	const labels = {
		contact_general: "Contact Form",
		admissions: "Admissions Application",
		demo_request: "Demo Request",
	};
	return labels[formType] || formType;
}

/**
 * Create success response
 */
function createSuccessResponse(data) {
	return ContentService.createTextOutput(
		JSON.stringify({
			result: "success",
			...data,
		}),
	).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Create error response
 */
function createErrorResponse(error) {
	return ContentService.createTextOutput(
		JSON.stringify({
			result: "error",
			error: error,
		}),
	).setMimeType(ContentService.MimeType.JSON);
}
