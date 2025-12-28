/**
 * Cambridge Computer Education - Form Submission Handler
 * Handles all form submissions across the website
 */

// ⚠️ IMPORTANT: Update this URL after deploying Google Apps Script
const SCRIPT_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";

// Fallback contact info (loaded from data.json)
let fallbackContact = {
	phone: "+91-9212331110",
	email: "info@cambridgecomputereducation.in",
};

/**
 * Initialize form handlers on page load
 */
$(document).ready(function () {
	// Load fallback contact from data.json if available
	if (window.siteData && window.siteData.institute) {
		fallbackContact.phone = window.siteData.institute.phone;
		fallbackContact.email = window.siteData.institute.email;
	}

	// Attach handlers to all forms with data-form-type attribute
	$("form[data-form-type]").on("submit", handleFormSubmit);
});

/**
 * Main form submission handler
 */
function handleFormSubmit(e) {
	e.preventDefault();

	const form = $(this);
	const formType = form.data("form-type");
	const submitBtn = form.find('button[type="submit"]');

	// Validate URL
	if (SCRIPT_URL.includes("YOUR_GOOGLE_APPS_SCRIPT")) {
		showErrorModal(
			"Configuration Error",
			"Form system not configured. Please contact administrator.",
		);
		return;
	}

	// Collect form data
	const formData = {};
	form.find("input, textarea, select").each(function () {
		const input = $(this);
		const name = input.attr("name");
		if (name) {
			formData[name] = input.val();
		}
	});

	// Add metadata
	formData.formType = formType;
	formData.pageSource = window.location.href;
	formData.userAgent = navigator.userAgent;

	// Show loading state
	const originalBtnText = submitBtn.html();
	submitBtn
		.prop("disabled", true)
		.html('<i class="fas fa-circle-notch fa-spin"></i> Submitting...');

	// Submit to Google Apps Script
	$.ajax({
		url: SCRIPT_URL,
		method: "POST",
		data: formData,
		dataType: "json",
		timeout: 15000, // 15 second timeout
	})
		.done(function (response) {
			if (response.result === "success") {
				showSuccessModal();
				form[0].reset(); // Reset form
			} else {
				showErrorModal("Submission Failed", response.error);
			}
		})
		.fail(function (xhr, status, error) {
			let errorMsg = "Network error. Please try again.";
			if (status === "timeout") {
				errorMsg =
					"Request timed out. Please check your connection and try again.";
			}
			showErrorModal("Connection Error", errorMsg);
		})
		.always(function () {
			// Restore button
			submitBtn.prop("disabled", false).html(originalBtnText);
		});
}

/**
 * Show success modal
 */
function showSuccessModal() {
	const modal = $(`
        <div id="form-success-modal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn">
            <div class="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl transform animate-scaleIn">
                <div class="text-center">
                    <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <i class="fas fa-check text-green-600 text-4xl"></i>
                    </div>
                    <h3 class="text-2xl font-bold text-slate-900 mb-3">Thank You!</h3>
                    <p class="text-slate-600 mb-6">Your submission has been received. Our team will contact you shortly.</p>
                    <button onclick="closeSuccessModal()" class="bg-secondary text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `);

	$("body").append(modal);

	// Auto-close after 5 seconds
	setTimeout(closeSuccessModal, 5000);
}

/**
 * Close success modal
 */
function closeSuccessModal() {
	$("#form-success-modal").fadeOut(300, function () {
		$(this).remove();
	});
}

/**
 * Show error modal with fallback contact info
 */
function showErrorModal(title, message) {
	const modal = $(`
        <div id="form-error-modal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn">
            <div class="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl transform animate-scaleIn">
                <div class="text-center">
                    <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i class="fas fa-exclamation-triangle text-red-600 text-4xl"></i>
                    </div>
                    <h3 class="text-2xl font-bold text-slate-900 mb-3">${title}</h3>
                    <p class="text-slate-600 mb-6">${message}</p>
                    
                    <div class="bg-slate-50 rounded-2xl p-6 mb-6 text-left">
                        <p class="text-sm font-bold text-slate-700 mb-4">Please contact us directly:</p>
                        <div class="space-y-3">
                            <a href="tel:${fallbackContact.phone}" class="flex items-center gap-3 text-secondary hover:text-blue-700 transition-colors">
                                <i class="fas fa-phone w-5"></i>
                                <span class="font-semibold">${fallbackContact.phone}</span>
                            </a>
                            <a href="mailto:${fallbackContact.email}" class="flex items-center gap-3 text-secondary hover:text-blue-700 transition-colors">
                                <i class="fas fa-envelope w-5"></i>
                                <span class="font-semibold">${fallbackContact.email}</span>
                            </a>
                        </div>
                    </div>
                    
                    <div class="flex gap-3">
                        <button onclick="closeErrorModal()" class="flex-1 bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-300 transition-colors">
                            Close
                        </button>
                        <button onclick="retrySubmission()" class="flex-1 bg-secondary text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `);

	$("body").append(modal);
}

/**
 * Close error modal
 */
function closeErrorModal() {
	$("#form-error-modal").fadeOut(300, function () {
		$(this).remove();
	});
}

/**
 * Retry last submission
 */
function retrySubmission() {
	closeErrorModal();
	// Find the last submitted form and trigger submit again
	const lastForm = $("form[data-form-type]").last();
	if (lastForm.length) {
		lastForm.trigger("submit");
	}
}

// Add CSS animations
const style = document.createElement("style");
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes scaleIn {
        from { transform: scale(0.9); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
    }
    .animate-fadeIn {
        animation: fadeIn 0.3s ease-out;
    }
    .animate-scaleIn {
        animation: scaleIn 0.3s ease-out;
    }
`;
document.head.appendChild(style);
