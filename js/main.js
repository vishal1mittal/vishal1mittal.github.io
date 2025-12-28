// Global state to track initialization
window.isNavigating = false;

$(document).ready(function () {
	initApp();
});

function initApp() {
	// 1. Load Header and Footer
	$("#header-placeholder").load("components/header.html", function () {
		// Highlight active link
		const path = window.location.pathname;
		const page = path.split("/").pop() || "index.html";

		// Find matching links
		$(`#header-placeholder nav a[href='${page}']`).addClass(
			"text-secondary font-bold",
		);
		$(`#header-placeholder .mobile-link[href='${page}']`).addClass(
			"text-secondary bg-slate-50 font-bold",
		);

		// Setup Sticky Header
		// setupStickyHeader(); // DISABLED - Using CSS fixed position instead
	});
	$("#footer-placeholder").load("components/footer.html");

	// 2. Fetch Data
	$.getJSON("data/data.json", function (data) {
		window.siteData = data;
		initPageContent(data);
	}).fail(function () {
		console.error("Could not load data.json");
	});

	// 3. Bind Navigation Events
	bindNavigationEvents();
}

function bindNavigationEvents() {
	// Unbind first to prevent duplicates if re-running
	$(document)
		.off("click", "a")
		.on("click", "a", function (e) {
			const href = $(this).attr("href");
			const target = $(this).attr("target");

			// Filter: internal links only
			if (
				href &&
				!href.startsWith("#") &&
				!href.startsWith("mailto:") &&
				!href.startsWith("tel:") &&
				target !== "_blank"
			) {
				e.preventDefault();
				handleNavigation(href);
			}
		});

	// Prefetch on hover
	$(document)
		.off("mouseenter touchstart", "a")
		.on("mouseenter touchstart", "a", function () {
			const href = $(this).attr("href");
			if (
				href &&
				!href.startsWith("#") &&
				!href.startsWith("mailto:") &&
				!href.startsWith("tel:") &&
				!$(this).data("prefetched")
			) {
				$(this).data("prefetched", true);
				$("<link>", { rel: "prefetch", href: href }).appendTo("head");
			}
		});
}

async function handleNavigation(url) {
	if (window.isNavigating) return;
	window.isNavigating = true;

	// 1. Check Network for Fallback
	const connection =
		navigator.connection ||
		navigator.mozConnection ||
		navigator.webkitConnection;
	if (
		connection &&
		(connection.saveData || connection.effectiveType.includes("2g"))
	) {
		window.location.href = url; // Standard Load for slow connection
		return;
	}

	// 2. Animate Out
	$("body").addClass("page-exiting");

	try {
		// 3. Fetch Content & Wait for Min Animation (500ms)
		const minAnimationTime = 500;
		const startTime = Date.now();

		const response = await fetch(url);
		if (!response.ok) throw new Error("Network response was not ok");
		const html = await response.text();

		const elapsed = Date.now() - startTime;
		const remainingDelay = Math.max(0, minAnimationTime - elapsed);

		// Wait remaining time to ensure smoothness
		await new Promise((r) => setTimeout(r, remainingDelay));

		// 4. Update DOM
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, "text/html");

		// Swap Body Content
		document.body.innerHTML = doc.body.innerHTML;
		document.title = doc.title;

		// Scroll to top
		window.scrollTo(0, 0);

		// 5. Update URL
		window.history.pushState({}, "", url);

		// 6. Re-Initialize & Animate In
		$("body").removeClass("page-exiting");

		// Force Animation Restart
		document.body.style.animation = "none";
		void document.body.offsetWidth; // Trigger reflow
		document.body.style.animation = ""; // Revert to CSS default

		initApp();
	} catch (error) {
		console.error("Navigation failed", error);
		window.location.href = url; // Fallback
	} finally {
		window.isNavigating = false;
	}
}

// Handle Back/Forward Browser Buttons
window.onpopstate = function () {
	location.reload(); // Simple fallback for back button to ensure state is clean
};

// 3. Initialize Page Content based on URL/Path
function initPageContent(data) {
	const path = window.location.pathname;
	const page = path.split("/").pop();
	const urlParams = new URLSearchParams(window.location.search);

	if (page === "" || page === "index.html") {
		renderCourses(data);
	} else if (page === "courses.html") {
		renderCourses(data);
	} else if (page === "detail.html") {
		const id = urlParams.get("id");
		renderDetailPage(data, id);
	} else if (page === "placements.html") {
		renderPlacementsPage(data);
	} else if (page === "gallery.html") {
		renderGalleryPage(data);
	} else if (page === "news.html") {
		renderNewsPage(data);
	} else if (page === "news-detail.html") {
		const id = urlParams.get("id");
		renderNewsDetailPage(data, id);
	} else if (page === "alumni.html") {
		renderAlumniPage(data);
	}
}

// 4. Sticky Header Logic - DISABLED (Using CSS position:fixed instead)
/*
// 4. Sticky Header Logic
function setupStickyHeader() {
	let lastScrollTop = $(window).scrollTop();
	const header = $("#header-placeholder header");

	// Namespace event to ensure clean re-binding
	$(window)
		.off("scroll.stickyHeader")
		.on("scroll.stickyHeader", function () {
			const currentScroll = $(this).scrollTop();

			// Ignore negative scrolling (iOS bounce)
			if (currentScroll < 0) return;

			// Hide on scroll down (> 100px), Show on scroll up
			if (currentScroll > lastScrollTop && currentScroll > 100) {
				header.addClass("header-hidden");
			} else {
				header.removeClass("header-hidden");
			}

			lastScrollTop = currentScroll;
		});
}
*/

// --- Page Renderers ---

function renderCourses(data) {
	// Index Page: Show only 3
	const featuredContainer = $("#featured-courses");
	if (featuredContainer.length) {
		featuredContainer.empty();
		data.courses.slice(0, 3).forEach((course, index) => {
			const card = createCourseCard(course, index);
			featuredContainer.append(card);
		});
	}

	// All Courses Page: Show All
	const allCoursesContainer = $("#all-courses-container");
	if (allCoursesContainer.length) {
		allCoursesContainer.empty();
		data.courses.forEach((course, index) => {
			const card = createCourseCard(course, index);
			allCoursesContainer.append(card);
		});
	}
}

function createCourseCard(course, index = 0) {
	// Theme Rotation Logic - Re-shuffled for better distinction
	const themes = [
		{
			bg: "bg-red-50",
			btn: "bg-red-600",
			text: "text-red-900",
			badge: "bg-red-100 text-red-800",
			hex: "#fef2f2",
			btnHex: "#dc2626",
			textHex: "#7f1d1d",
			badgeBg: "#fee2e2",
			badgeText: "#991b1b",
		},
		{
			bg: "bg-blue-50",
			btn: "bg-blue-600",
			text: "text-blue-900",
			badge: "bg-blue-100 text-blue-800",
			hex: "#eff6ff",
			btnHex: "#2563eb",
			textHex: "#1e3a8a",
			badgeBg: "#dbeafe",
			badgeText: "#1e40af",
		},
		{
			bg: "bg-green-50",
			btn: "bg-green-600",
			text: "text-green-900",
			badge: "bg-green-100 text-green-800",
			hex: "#f0fdf4",
			btnHex: "#16a34a",
			textHex: "#14532d",
			badgeBg: "#dcfce7",
			badgeText: "#166534",
		},
		{
			bg: "bg-purple-50",
			btn: "bg-purple-600",
			text: "text-purple-900",
			badge: "bg-purple-100 text-purple-800",
			hex: "#faf5ff",
			btnHex: "#9333ea",
			textHex: "#581c87",
			badgeBg: "#f3e8ff",
			badgeText: "#6b21a8",
		},
		{
			bg: "bg-orange-50",
			btn: "bg-orange-600",
			text: "text-orange-900",
			badge: "bg-orange-100 text-orange-800",
			hex: "#fff7ed",
			btnHex: "#ea580c",
			textHex: "#7c2d12",
			badgeBg: "#ffedd5",
			badgeText: "#9a3412",
		},
		{
			bg: "bg-teal-50",
			btn: "bg-teal-600",
			text: "text-teal-900",
			badge: "bg-teal-100 text-teal-800",
			hex: "#f0fdfa",
			btnHex: "#0d9488",
			textHex: "#134e4a",
			badgeBg: "#ccfbf1",
			badgeText: "#115e59",
		},
	];

	const theme = themes[index % themes.length];
	console.log(
		`Rendering Course: ${course.title} | Index: ${index} | Theme: ${theme.bg}`,
	);

	return `
            <div class="group rounded-[2.5rem] p-4 pb-8 ${theme.bg} transition-all duration-300 hover:-translate-y-2 hover:shadow-xl border border-white/50 relative overflow-hidden" style="background-color: ${theme.hex} !important;">
                 <!-- Decorative Shape -->
                 <div class="absolute -right-10 -top-10 w-40 h-40 bg-white/20 rounded-full blur-3xl group-hover:bg-white/30 transition-colors"></div>

                 <div class="bg-white rounded-[2rem] p-2 mb-6 shadow-sm overflow-hidden h-60 relative z-10">
                    <img src="${course.image}" alt="${course.title}" class="w-full h-full object-cover rounded-[1.5rem] group-hover:scale-110 transition-transform duration-700 ease-out">
                    <div class="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold text-primary shadow-sm flex items-center gap-2">
                        <i class="far fa-clock"></i> ${course.duration}
                    </div>
                 </div>
                 
                 <div class="px-4 text-center relative z-10">
                    <div class="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase mb-4 ${theme.badge}" style="background-color: ${theme.badgeBg}; color: ${theme.badgeText};">${course.level}</div>
                    
                    <h3 class="text-2xl font-bold ${theme.text} mb-3 font-heading leading-tight" style="color: ${theme.textHex};">${course.title}</h3>
                    <p class="text-slate-600 text-sm mb-8 line-clamp-2 leading-relaxed opacity-80">${course.short_desc}</p>
                    
                    <a href="detail.html?id=${course.id}" class="block w-full py-4 rounded-xl text-white font-bold text-sm shadow-lg ${theme.btn} hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all" style="background-color: ${theme.btnHex} !important;">
                        View Course Details <i class="fas fa-arrow-right ml-2 text-xs opacity-70"></i>
                    </a>
                 </div>
            </div>
        `;
}

function renderDetailPage(data, courseId) {
	const course = data.courses.find((c) => c.id === courseId);
	const container = $("#course-detail-container");

	if (!course) {
		container.html(
			'<div class="text-center py-20 flex flex-col items-center"><div class="text-6xl mb-6">🔍</div><h2 class="text-3xl font-bold text-slate-800 mb-4">Course Not Found</h2><p class="text-slate-500 mb-8">We could not find the course you are looking for.</p><a href="index.html" class="btn btn-primary rounded-full px-8 py-4">Go Home</a></div>',
		);
		return;
	}

	// Projects HTML Generation
	const projectsHtml = (course.projects || [])
		.map(
			(p) => `
        <div class="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-colors">
             <div class="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center text-white mb-4 shadow-lg">
                 <i class="fas fa-code-branch"></i>
             </div>
             <h4 class="font-bold text-white text-lg mb-2">${p.title}</h4>
             <div class="flex flex-wrap gap-2">
                ${p.tags
					.map(
						(tag) =>
							`<span class="text-[10px] bg-white/20 px-2 py-1 rounded-md text-slate-200 font-mono">${tag}</span>`,
					)
					.join("")}
             </div>
        </div>
    `,
		)
		.join("");

	const html = `
            <!-- Floating Navigation (Breadcrumb) -->
            <div class="container mb-8">
                <a href="courses.html" class="inline-flex items-center text-slate-500 hover:text-secondary font-medium transition-colors">
                    <i class="fas fa-arrow-left mr-2"></i> Back to Courses
                </a>
            </div>

            <!-- Modern Split Header with Glassmorphism -->
            <div class="container">
                <div class="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border border-slate-100 overflow-hidden relative">
                    <!-- Background Decoration -->
                    <div class="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-blue-50 via-purple-50 to-transparent rounded-full translate-x-1/3 -translate-y-1/3 opacity-70 pointer-events-none"></div>

                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 relative z-10">
                        <!-- Left Content -->
                        <div class="flex flex-col justify-center">
                            <div class="flex flex-wrap gap-3 mb-6">
                                <span class="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
                                    <i class="fas fa-layer-group mr-2"></i>${
										course.level
									}
                                </span>
                                <span class="px-4 py-2 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">
                                    <i class="fas fa-check-circle mr-2"></i>Certified
                                </span>
                            </div>

                            <h1 class="text-4xl md:text-6xl font-heading font-extrabold text-slate-900 mb-6 leading-[1.1]">
                                ${course.title}
                            </h1>
                            <p class="text-lg text-slate-500 mb-8 leading-relaxed max-w-xl">
                                ${course.description}
                                <br><br>
                                Master the tools and technologies used by top companies. This course is designed to take you from basics to professional proficiency.
                            </p>

                            <div class="flex flex-wrap gap-8 py-8 border-t border-slate-100">
                                <div>
                                    <div class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Duration</div>
                                    <div class="text-xl font-bold text-slate-800"><i class="far fa-clock text-secondary mr-2"></i>${
										course.duration
									}</div>
                                </div>
                                <div>
                                    <div class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Format</div>
                                    <div class="text-xl font-bold text-slate-800"><i class="fas fa-laptop-house text-purple-500 mr-2"></i>Online / Offline</div>
                                </div>
                            </div>
                        </div>

                        <!-- Right Image/Preview -->
                        <div class="relative">
                            <div class="absolute inset-0 bg-secondary rounded-[2.5rem] rotate-3 opacity-20 blur-sm transform scale-95 translate-y-4"></div>
                            <img src="${
								course.image
							}" class="relative w-full rounded-[2.5rem] shadow-2xl border-4 border-white object-cover transform transition-transform hover:scale-[1.01] duration-500" alt="${
		course.title
	}">
                            
                            <!-- Floating Badge -->
                            <div class="absolute bottom-8 left-8 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg flex items-center gap-4 max-w-xs animate-bounce" style="animation-duration: 4s;">
                                <div class="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 text-xl">
                                    <i class="fas fa-fire"></i>
                                </div>
                                <div>
                                    <div class="text-xs font-bold text-slate-400 uppercase">Popular</div>
                                    <div class="font-bold text-slate-800">High Demand Skill</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Curriculum & Form Section -->
            <div class="container py-20">
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    <!-- Curriculum (8 Cols) -->
                    <div class="lg:col-span-8">
                        <h2 class="text-3xl font-heading font-bold text-slate-900 mb-8 flex items-center gap-3">
                            <span class="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center text-white text-sm"><i class="fas fa-book-open"></i></span>
                            What You Will Learn
                        </h2>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            ${course.curriculum
								.map(
									(item, i) => `
                                <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                                    <div class="flex items-start gap-4">
                                        <div class="min-w-[2rem] h-8 bg-blue-50 rounded-full flex items-center justify-center text-secondary font-bold text-sm mt-1 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            ${i + 1}
                                        </div>
                                        <div>
                                            <h4 class="font-bold text-slate-800 text-lg mb-2">${item}</h4>
                                            <p class="text-slate-500 text-sm">Comprehensive implementation and practical usage of ${
												item.split(" ")[0]
											} concepts.</p>
                                        </div>
                                    </div>
                                </div>
                            `,
								)
								.join("")}
                        </div>

                        <!-- Projects Section -->
                        <div class="mt-16 bg-slate-900 text-white rounded-[3rem] p-10 relative overflow-hidden">
                            <!-- Glow effects -->
                            <div class="absolute top-0 right-0 w-64 h-64 bg-secondary rounded-full blur-[80px] opacity-40"></div>
                            <div class="absolute bottom-0 left-0 w-64 h-64 bg-purple-600 rounded-full blur-[80px] opacity-30"></div>
                            
                            <div class="relative z-10">
                                <h3 class="text-3xl font-heading font-bold mb-4 text-white">Build Real Projects 🚀</h3>
                                <p class="text-slate-300 leading-relaxed mb-8 max-w-2xl">Theory is boring. You'll build ${
									course.projects
										? course.projects.length
										: "5+"
								} industry-grade projects including a final Capstone Project to showcase on your resume.</p>
                                
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    ${
										projectsHtml ||
										`
                                        <div class="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/10">
                                            <p class="text-slate-400 italic">Project details coming soon...</p>
                                        </div>
                                    `
									}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Sticky Sidebar Form (4 Cols) -->
                    <div class="lg:col-span-4">
                        <div class="sticky top-28 space-y-8">
                            <!-- Form Card -->
                            <div class="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-blue-900/5 border border-slate-100 relative overflow-hidden">
                                <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                                
                                <h3 class="text-2xl font-bold text-slate-900 mb-2">Secure Your Spot</h3>
                                <p class="text-slate-500 mb-8 text-sm">Limited seats available for the upcoming batch.</p>
                                
                                
                                <form id="course-detail-form" data-form-type="demo_request" class="space-y-4">
                                    <input type="hidden" name="course" value="${
										course.title
									}">
                                    
                                    <div>
                                        <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Full Name</label>
                                        <input type="text" name="name" placeholder="John Doe" required class="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-secondary focus:ring-4 focus:ring-blue-500/10 transition-all font-medium">
                                    </div>
                                    
                                    <div>
                                        <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Email Address</label>
                                        <input type="email" name="email" placeholder="your@email.com" required class="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-secondary focus:ring-4 focus:ring-blue-500/10 transition-all font-medium">
                                    </div>
                                    
                                    <div>
                                        <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Phone Number</label>
                                        <input type="tel" name="phone" placeholder="+91 98765 43210" required class="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-secondary focus:ring-4 focus:ring-blue-500/10 transition-all font-medium">
                                    </div>
                                    
                                    <button type="submit" class="w-full h-14 bg-secondary text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2 group">
                                        Book Free Demo <i class="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                                    </button>
                                </form>
                                
                                <div class="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400 bg-slate-50 py-3 rounded-lg">
                                    <i class="fas fa-shield-alt"></i> No spam. Your data is safe.
                                </div>
                            </div>

                            <!-- Contact Info -->
                            <div class="bg-indigo-900 rounded-[2.5rem] p-8 relative overflow-hidden text-white">
                                <div class="absolute bottom-0 right-0 w-32 h-32 bg-indigo-600 rounded-full blur-2xl opacity-50 translate-x-1/2 translate-y-1/2"></div>
                                <h4 class="font-bold text-lg mb-4 text-white">Need Help?</h4>
                                <div class="space-y-4 relative z-10">
                                    <a href="tel:${
										data.institute.phone
									}" class="flex items-center gap-4 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors group">
                                        <div class="w-10 h-10 rounded-full bg-white text-indigo-900 flex items-center justify-center text-sm group-hover:scale-110 transition-transform"><i class="fas fa-phone"></i></div>
                                        <div class="font-bold text-sm text-white">${
											data.institute.phone
										}</div>
                                    </a>
                                    <a href="mailto:${
										data.institute.email
									}" class="flex items-center gap-4 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors group">
                                        <div class="w-10 h-10 rounded-full bg-white text-indigo-900 flex items-center justify-center text-sm group-hover:scale-110 transition-transform"><i class="fas fa-envelope"></i></div>
                                        <div class="font-bold text-sm text-white">${
											data.institute.email
										}</div>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    `;

	container.html(html);
	window.scrollTo(0, 0); // Ensure top of page on render
}

function renderPlacementsPage(data) {
	const container = $("#placements-container");
	if (container.length) {
		container.empty();
		data.placements.forEach((p) => {
			const card = `
                    <div class="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-300">
                        <div class="w-20 h-20 rounded-full overflow-hidden mb-4 border-4 border-slate-50 shadow-inner">
                            <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover">
                        </div>
                        <h3 class="text-lg font-bold text-primary mb-1">${p.name}</h3>
                        <p class="text-secondary text-sm font-bold mb-4">${p.role} @ ${p.company}</p>
                        <div class="relative">
                            <i class="fas fa-quote-left text-slate-100 text-4xl absolute -top-4 -left-2 -z-10"></i>
                             <p class="text-slate-500 italic text-sm relative z-10 leading-relaxed">"${p.testimonial}"</p>
                        </div>
                    </div>
                `;
			container.append(card);
		});
	}
}

function renderGalleryPage(data) {
	const container = $("#gallery-container");
	if (container.length) {
		container.empty();
		data.gallery.forEach((img) => {
			const item = `
                    <div class="group relative overflow-hidden rounded-2xl h-80 shadow-md">
                        <img src="${img.src}" alt="${img.caption}" class="w-full h-full object-cover transition duration-700 group-hover:scale-110">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                             <p class="text-white font-bold text-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-300">${img.caption}</p>
                        </div>
                    </div>
                 `;
			container.append(item);
		});
	}

	// Calculate Consensus
	const avgRating = (
		data.reviews.reduce((acc, r) => acc + r.rating, 0) / data.reviews.length
	).toFixed(1);

	const reviewsContainer = $("#reviews-container");
	if (reviewsContainer.length) {
		reviewsContainer.empty();

		// Consensus Card
		const consensus = `
		        <div class="col-span-full mb-8 w-full">
		            <div class="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center gap-8">
		                 <div class="flex-grow text-center md:text-left">
		                        <h3 class="text-2xl font-bold mb-2">AI Summary: Student Verdict</h3>
		                        <p class="text-blue-100 text-lg leading-relaxed mb-4">"Consensus indicates students highly value the <span class="font-bold text-white">practical training approach</span> and <span class="font-bold text-white">supportive faculty</span>. Location convenience is a frequently mentioned plus."</p>
                                <div class="inline-flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full text-sm text-blue-200">
                                    <i class="fab fa-google"></i> <i class="fab fa-facebook"></i>
                                    <span>Analysis based on <strong>1,250+</strong> online reviews</span>
                                </div>
		                 </div>
		                 <div class="flex-shrink-0 bg-white/10 backdrop-blur rounded-2xl p-6 text-center min-w-[150px]">
		                        <div class="text-5xl font-bold mb-1">${avgRating}</div>
		                        <div class="text-yellow-400 text-xl mb-1">
		                            <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star-half-alt"></i>
		                        </div>
		                        <div class="text-xs uppercase tracking-wider opacity-80">Average Rating</div>
		                 </div>
		            </div>
		        </div>
		    `;
		reviewsContainer.append(consensus);

		// Individual Reviews
		data.reviews.forEach((review) => {
			const stars = Array(review.rating)
				.fill('<i class="fas fa-star text-yellow-400 text-xs"></i>')
				.join("");
			const card = `
		            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
		                <div class="flex justify-between items-start mb-4">
		                    <div class="flex gap-1">${stars}</div>
		                    <span class="text-xs text-slate-400 border border-slate-200 px-2 py-1 rounded bg-slate-50">${
								review.source
							}</span>
		                </div>
		                <p class="text-slate-600 mb-4 text-sm leading-relaxed flex-grow">"${
							review.text
						}"</p>
		                <div class="flex items-center gap-3 pt-4 border-t border-slate-50 mt-auto">
		                    <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold">
		                        ${review.user.charAt(0)}
		                    </div>
		                    <span class="text-sm font-bold text-primary">${
								review.user
							}</span>
		                </div>
		            </div>
		        `;
			reviewsContainer.append(card);
		});
	}
}

// --- News Renderers ---

function renderNewsPage(data) {
	const container = $("#news-container");
	if (container.length && data.news) {
		container.empty();
		data.news.forEach((item) => {
			// Determine button logic
			let btnHtml = "";
			const action = item.action;

			if (action.type === "view_detail") {
				btnHtml = `<a href="news-detail.html?id=${item.id}" class="text-secondary font-bold hover:underline">
                            ${action.label} <i class="fas fa-arrow-right ml-1"></i>
                           </a>`;
			} else if (action.type === "download") {
				btnHtml = `<a href="${action.target}" ${
					action.is_asset ? "download" : ""
				} class="text-green-600 font-bold hover:underline">
                            <i class="fas fa-download mr-1"></i> ${action.label}
                           </a>`;
			} else if (action.type === "internal_link") {
				btnHtml = `<a href="${action.target}" class="text-purple-600 font-bold hover:underline">
                            ${action.label} <i class="fas fa-external-link-alt ml-1"></i>
                           </a>`;
			}

			const card = `
                <div class="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col h-full group">
                    <div class="h-48 overflow-hidden relative">
                        <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                        <div class="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold text-slate-800 shadow-sm">
                            ${item.category}
                        </div>
                    </div>
                    <div class="p-6 flex flex-col flex-grow">
                        <div class="text-xs text-slate-400 font-bold mb-2 uppercase tracking-wider">${item.date}</div>
                        <h3 class="text-xl font-bold text-primary mb-3 leading-tight">${item.title}</h3>
                        <p class="text-slate-500 text-sm mb-6 flex-grow">${item.excerpt}</p>
                        <div class="pt-4 border-t border-slate-50">
                            ${btnHtml}
                        </div>
                    </div>
                </div>
            `;
			container.append(card);
		});
	}
}

function renderNewsDetailPage(data, id) {
	const container = $("#news-detail-container");
	const item = data.news ? data.news.find((n) => n.id === id) : null;

	if (!item) {
		container.html(
			'<div class="container py-20 text-center"><h2 class="text-2xl font-bold text-slate-700">News item not found</h2><a href="news.html" class="text-secondary hover:underline mt-4 block">Back to News</a></div>',
		);
		return;
	}

	const html = `
        <!-- Hero -->
        <div class="relative h-[400px]">
            <img src="${item.image}" class="w-full h-full object-cover">
            <div class="absolute inset-0 bg-gradient-to-t from-primary/90 to-transparent"></div>
            <div class="absolute bottom-0 left-0 w-full p-8 md:p-12 text-white">
                <div class="container">
                    <a href="news.html" class="inline-block mb-6 text-white/80 hover:text-white transition-colors"><i class="fas fa-arrow-left mr-2"></i>Back to News</a>
                    <div class="flex items-center gap-4 mb-4">
                        <span class="bg-secondary px-3 py-1 rounded-full text-xs font-bold">${
							item.category
						}</span>
                        <span class="text-slate-300 text-sm font-medium"><i class="far fa-calendar mr-2"></i>${
							item.date
						}</span>
                    </div>
                    <h1 class="text-3xl md:text-5xl font-heading font-bold max-w-4xl leading-tight">${
						item.title
					}</h1>
                </div>
            </div>
        </div>

        <!-- Content -->
        <div class="container py-12 md:py-20">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div class="lg:col-span-8">
                    <div class="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100 prose prose-lg prose-slate max-w-none">
                        <p class="lead text-xl text-slate-600 font-medium mb-8 border-l-4 border-secondary pl-4 bg-slate-50 py-4 rounded-r-xl">${
							item.excerpt
						}</p>
                        ${
							item.content ||
							'<p class="text-slate-400 italic">No additional content available for this update.</p>'
						}
                    </div>
                </div>
                
                <div class="lg:col-span-4">
                    <div class="sticky top-24">
                        <div class="bg-white rounded-3xl p-8 shadow-lg border border-slate-100">
                             <h4 class="font-bold text-lg mb-4 text-slate-900">Share this</h4>
                             <div class="flex gap-2 mb-8">
                                <button class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center"><i class="fab fa-facebook-f"></i></button>
                                <button class="w-10 h-10 rounded-full bg-sky-100 text-sky-500 hover:bg-sky-500 hover:text-white transition-all flex items-center justify-center"><i class="fab fa-twitter"></i></button>
                                <button class="w-10 h-10 rounded-full bg-green-100 text-green-600 hover:bg-green-600 hover:text-white transition-all flex items-center justify-center"><i class="fab fa-whatsapp"></i></button>
                             </div>
                             
                             <h4 class="font-bold text-lg mb-4 text-slate-900">Other Updates</h4>
                             <div class="space-y-4">
                                ${data.news
									.filter((n) => n.id !== id)
									.slice(0, 3)
									.map(
										(n) => `
                                        <a href="news-detail.html?id=${n.id}" class="block group">
                                            <div class="text-xs text-slate-400 mb-1">${n.date}</div>
                                            <div class="font-bold text-slate-700 text-sm group-hover:text-secondary transition-colors line-clamp-2">${n.title}</div>
                                        </a>
                                    `,
									)
									.join("")}
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

	container.html(html);
	window.scrollTo(0, 0);
}

function renderAlumniPage(data) {
	const container = $("#alumni-container");
	if (container.length && data.alumni) {
		container.empty();
		data.alumni.forEach((alum) => {
			const card = `
                <div class="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col h-full group">
                    <div class="p-8 text-center flex flex-col h-full">
                        <div class="w-24 h-24 mx-auto rounded-full overflow-hidden mb-4 border-4 border-slate-100 group-hover:border-secondary transition-colors">
                            <img src="${alum.image}" alt="${
				alum.name
			}" class="w-full h-full object-cover">
                        </div>
                        <h3 class="text-xl font-bold text-primary mb-2">${
							alum.name
						}</h3>
                        <p class="text-secondary font-semibold text-sm mb-1">${
							alum.position
						}</p>
                        <p class="text-slate-400 text-xs uppercase tracking-wider mb-6">Batch of ${
							alum.batch
						}</p>
                        
                        <div class="flex justify-center gap-2 mt-auto pt-4 border-t border-slate-50">
                            ${
								alum.linkedin
									? `<a href="${alum.linkedin}" class="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all text-sm"><i class="fab fa-linkedin-in"></i></a>`
									: ""
							}
                            ${
								alum.twitter
									? `<a href="${alum.twitter}" class="w-9 h-9 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center hover:bg-sky-500 hover:text-white transition-all text-sm"><i class="fab fa-twitter"></i></a>`
									: ""
							}
                            ${
								alum.email
									? `<a href="mailto:${alum.email}" class="w-9 h-9 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-all text-sm"><i class="fas fa-envelope"></i></a>`
									: ""
							}
                        </div>
                    </div>
                </div>
            `;
			container.append(card);
		});
	}
}
