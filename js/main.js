// --- FIREBASE BOILERPLATE (Setup and Seeding Logic) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, onSnapshot, addDoc, getDocs, serverTimestamp, orderBy, limit } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { runTransaction } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Use global variables provided by the environment, or fallbacks
const appId = typeof __app_id !== 'undefined' ? __app_id : 'codebykavin'; // Align with projectId for consistency
const firebaseConfig = {
  apiKey: "%%FIREBASE_API_KEY%%",
  authDomain: "%%FIREBASE_AUTH_DOMAIN%%",
  projectId: "%%FIREBASE_PROJECT_ID%%",
  storageBucket: "%%FIREBASE_STORAGE_BUCKET%%",
  messagingSenderId: "%%FIREBASE_MESSAGING_SENDER_ID%%",
  appId: "%%FIREBASE_APP_ID%%"
};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

let db, auth, userId = null;

// --- DYNAMIC DATA STATE (Populated by Firestore Listeners) ---
let appsData = []; // Main list of apps (no changelog included)
let developer = null;
let isDataReady = false;
let currentPage = 'home';
let currentFilter = 'all'; 
let currentSort = 'Newest';
let currentSearch = ''; 

// State for detail page rendering (only stores the ID, data is fetched dynamically)
let selectedAppId = null; 


// Helper to map category ID to display name and icon
const getDisplayCategoryDetails = (categoryId) => {
    switch (categoryId) {
        case 'productivity': return { name: 'Productivity', icon: 'calendar-check' };
        case 'games': return { name: 'Fun', icon: 'gamepad-2' };
        case 'tools': return { name: 'Tools', icon: 'wrench' };
        case 'experiments': return { name: 'Experiments', icon: 'flask-conical' };
        case 'misc': return { name: 'Misc', icon: 'layout-grid' }; // Default for CMS
        default: return { name: categoryId, icon: 'layout-grid' }; // Fallback
    }
};

// --- UTILITIES (REPLACING MOCK DATA & SEEDING) ---

/**
 * Converts a numeric download count to a human-readable string (e.g., 1200 -> 1.2K).
 */
const humanReadableDownloads = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
};

/**
 * Formats a Firebase Timestamp or Date object into a readable date string.
 */
const formatDate = (timestamp) => {
     if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } else if (timestamp instanceof Date) {
         return timestamp.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    return 'N/A';
};

const alertMessage = (message, type = 'info') => {
    const container = document.getElementById('message-container');
    const colors = {
        info: 'bg-accent-primary text-black',
        success: 'bg-green-500 text-white',
        error: 'bg-accent-secondary text-white'
    };
    const colorClass = colors[type] || colors['info'];

    const messageBox = document.createElement('div');
    messageBox.className = `${colorClass} p-4 mb-2 rounded-lg shadow-lg font-medium transition-all duration-300 transform translate-x-full opacity-0`;
    messageBox.innerHTML = `<span>${message}</span>`;
    container.prepend(messageBox);
    setTimeout(() => messageBox.classList.remove('translate-x-full', 'opacity-0'), 50); // Animate in
    setTimeout(() => messageBox.remove(), 5000); // Auto-dismiss
};
window.alertMessage = alertMessage; // Make it globally accessible
// Note: The seedPublicData function has been completely removed.


/**
 * Sets up real-time listeners for all necessary data and updates global state.
 */
function setupFirestoreListeners() {
    if (!db) return;
    
    let appsLoaded = false;
    let developerLoaded = false;

    const checkReady = async () => {
        if (appsLoaded && developerLoaded && !isDataReady) {
            isDataReady = true;
            // Initial render of the home page once all data is loaded
            handleRouting(); // Let the router decide the initial page
        } else if (isDataReady) {
            // Re-render current page when data updates (real-time feature)
            showPage(currentPage, { filter: currentFilter, sort: currentSort }, false); 
        }
    };

    // 1. Apps Collection Listener - Sort by releaseDate (newest first)
    const appsCollectionRef = collection(db, `artifacts/${appId}/public/data/apps`);
    // Use orderBy for server-side sorting of the app list
    const appsQuery = query(appsCollectionRef, orderBy('releaseDate', 'desc')); 
    
    onSnapshot(appsQuery, (snapshot) => {
        appsData = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            // Resolve category reference to its ID and then to a display name
            categoryName: doc.data().category ? getDisplayCategoryDetails(doc.data().category.id).name : 'N/A',
            categoryId: doc.data().category ? doc.data().category.id : 'N/A'
        })); 

        appsLoaded = true;
        console.log(`Loaded ${appsData.length} apps from Firestore.`);
        checkReady();
    }, (error) => {
        console.error("FATAL ERROR listening to apps (Check Security Rules):", error);
        appsLoaded = false; 
        isDataReady = false;
    });

    // 2. Developer Profile Document Listener
    const developerDocRef = doc(db, `artifacts/${appId}/public/data/developerProfile/profile`);
    onSnapshot(developerDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
            developer = docSnapshot.data();
            developerLoaded = true;
            console.log('Loaded developer profile from Firestore.');
        } else {
            console.error("Developer profile document does not exist. Please add profile data.");
            developer = null;
            developerLoaded = true; 
        }
        checkReady();
    }, (error) => {
        console.error("FATAL ERROR listening to developer profile (Check Security Rules):", error);
        developerLoaded = false;
        isDataReady = false;
    });
}


async function initFirebase() {
    try {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        setLogLevel('Debug'); // Enable logging

        // Authentication
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                userId = user.uid;
                console.log('User signed in:', userId);
                
                // Setup Real-time Listeners
                setupFirestoreListeners(); 

            } else {
                // Sign in anonymously if no token is available
                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken);
                } else {
                    await signInAnonymously(auth);
                }
            }
        });
    } catch (error) {
        console.error("Firebase initialization failed:", error);
        contentDiv.innerHTML = `<div class="text-center p-20 text-red-500">
            <h1 class="text-3xl font-bold mb-2">Error Initializing Firebase</h1>
            <p>Please check your configuration and network connection.</p>
        </div>`;
    }
    // Remove debug logging in production
    setLogLevel('silent');
}

// Initialize Firebase on load
// Helper to infer link icon and label from URL
const getLinkDetails = (url) => {
    let icon = 'link'; // Default icon
    let label = url; // Default label

    if (url.includes('github.com')) { icon = 'github'; label = 'GitHub'; }
    else if (url.includes('linkedin.com')) { icon = 'linkedin'; label = 'LinkedIn'; }
    else if (url.includes('twitter.com')) { icon = 'twitter'; label = 'Twitter'; }
    else if (url.includes('mailto:')) { icon = 'mail'; label = 'Email'; }
    return { url, icon, label };
};

// --- Lightbox Functions ---
window.openLightbox = (imageUrl) => {
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    if (lightbox && lightboxImage) {
        lightboxImage.src = imageUrl;
        lightbox.classList.remove('hidden');
        lightbox.classList.add('flex');
    }
};

window.closeLightbox = () => {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.classList.add('hidden');
        lightbox.classList.remove('flex');
    }
};

// --- END FIREBASE BOILERPLATE ---


// --- UI UTILITIES & STATE ---
const contentDiv = document.getElementById('content');
const body = document.documentElement;

// Mobile Menu Toggle
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');

const toggleMobileMenu = () => {
    mobileMenu.classList.toggle('hidden');
};

const handleMobileLinkClick = (hash) => {
    location.hash = hash;
    toggleMobileMenu();
};
window.handleMobileLinkClick = handleMobileLinkClick;

mobileMenuButton.addEventListener('click', toggleMobileMenu);

// Back to Top Button visibility
window.addEventListener('scroll', () => {
    const backToTop = document.getElementById('back-to-top');
    if (window.scrollY > 300) {
        backToTop.classList.remove('opacity-0', 'translate-y-4');
        backToTop.classList.add('opacity-100', 'translate-y-0');
    } else {
        backToTop.classList.remove('opacity-100', 'translate-y-0');
        backToTop.classList.add('opacity-0', 'translate-y-4');
    }
});

// --- TEMPLATING FUNCTIONS ---

const starRating = (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    let starsHtml = '';
    for (let i = 0; i < fullStars; i++) starsHtml += `<i data-lucide="star" class="w-4 h-4 fill-accent-cta text-accent-cta stroke-accent-cta"></i>`;
    if (halfStar) starsHtml += `<i data-lucide="star-half" class="w-4 h-4 fill-accent-cta text-accent-cta stroke-accent-cta"></i>`;
    for (let i = 0; i < emptyStars; i++) starsHtml += `<i data-lucide="star" class="w-4 h-4 text-accent-cta opacity-30 stroke-accent-cta"></i>`;
    return `<div class="flex items-center space-x-0.5">${starsHtml}</div>`;
};

const createUserRating = (appId, currentRating) => {
    const ratedApps = JSON.parse(localStorage.getItem('ratedApps') || '{}');
    const hasRated = ratedApps[appId];

    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
        starsHtml += `
            <i 
                data-lucide="star" 
                class="w-6 h-6 transition-colors duration-200 
                    ${hasRated ? 'text-gray-500' : 'text-gray-400 hover:text-accent-cta cursor-pointer'}"
                ${!hasRated ? `
                    onmouseover="this.parentElement.childNodes.forEach((s, idx) => { if(s.nodeType === 1 && idx < ${i}) s.classList.add('text-accent-cta')});"
                    onmouseout="this.parentElement.childNodes.forEach(s => { if(s.nodeType === 1) s.classList.remove('text-accent-cta') });"
                    onclick="submitRating('${appId}', ${i})"` : ''}
            ></i>`;
    }

    return `
        <div class="card-glass p-6 rounded-2xl shadow-soft-dark">
            <h3 class="text-xl font-bold mb-3">${hasRated ? 'You have rated this app' : 'Rate this app'}</h3>
            <div class="flex items-center justify-center space-x-2">
                ${starsHtml}
            </div>
            ${hasRated ? `<p class="text-center text-xs text-gray-500 mt-2">Your rating has been recorded.</p>` : ''}
        </div>
    `;
};

const getCategoryIcon = (category) => {
    const details = getDisplayCategoryDetails(category.toLowerCase());
    return details.icon;
};
const createAppCard = (app) => `
    <div 
        onclick="location.hash = '#app/${app.id}'"
        class="card-glass p-6 rounded-2xl transition duration-300 ease-in-out shadow-soft-dark dark:shadow-soft-dark bg-card-light dark:bg-card-dark transform hover:shadow-neon-primary cursor-pointer hover:scale-[1.02]"
    >
        <div class="flex items-center space-x-4 mb-4">
            <!-- App Icon (using Lucide icon as placeholder) -->
            <div class="p-3 rounded-xl bg-accent-primary/20 dark:bg-accent-primary/20 text-accent-primary">
                <i data-lucide="${app.icon && app.icon.length > 0 ? app.icon : 'package'}" class="w-8 h-8"></i>
            </div>
            <div>
                <h3 class="text-xl font-bold">${app.name}</h3>
                <p class="text-xs mono dark:text-text-secondary-dark text-text-secondary-light">
                    ${app.version} | ${app.categoryName || 'N/A'}
                </p>
            </div>
        </div>
        <p class="dark:text-text-secondary-dark text-text-secondary-light mb-4 text-sm">${app.tagline}</p>
        <div class="flex justify-between items-center">
            ${starRating(app.rating)}
            <button class="px-4 py-2 rounded-lg font-semibold text-sm transition duration-200 ease-in-out bg-accent-primary text-[#0F111A] hover:bg-opacity-90 hover:shadow-md">
                Explore
            </button>
        </div>
    </div>
`;

// --- PAGE RENDERERS ---

const renderLoadingPage = () => `
    <div class="flex flex-col items-center justify-center h-[60vh] text-center">
        <div class="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 dark:border-card-dark h-16 w-16 mb-4"></div>
        <h2 class="text-2xl font-bold dark:text-accent-primary">Initializing App Store...</h2>
        <p class="dark:text-text-secondary-dark">Connecting to Firebase and fetching Kavin's creations.</p>
    </div>
`;

const renderHomePage = () => {
    if (!isDataReady) return renderLoadingPage();

    if (appsData.length === 0 && !developer) {
         return `<div class="text-center p-20">
            <i data-lucide="database" class="w-16 h-16 mx-auto text-accent-secondary mb-4"></i>
            <h1 class="text-3xl font-bold mb-2">No Data Found</h1>
            <p class="dark:text-text-secondary-dark mb-6">The database appears to be empty. Please populate the 'apps' and 'developer-profile' collections in Firestore.</p>
        </div>`;
    }
    
    // Use the featuredAppId from the developer profile to find the featured app
    const featuredApp = developer?.featuredAppId ? appsData.find(app => app.id === developer.featuredAppId) : appsData[0];

    
    // For the Home page updates, we use the denormalized version and releaseDate from the app document itself.
    const updates = appsData.slice(0, 4).map(app => ({
        appName: app.name,
        appId: app.id,
        version: app.version,
        date: formatDate(app.releaseDate),
    }));


    return `
        <!-- Hero Section -->
        <section class="hero-bg rounded-3xl p-8 md:p-16 mb-16 text-center shadow-2xl dark:shadow-soft-dark">
            <h1 class="text-4xl md:text-6xl font-extrabold mb-4 leading-tight text-text-primary-dark">
                Welcome to <span class="text-accent-primary">CodeByKavin</span>
            </h1>
            <p class="text-xl md:text-2xl mb-8 dark:text-text-secondary-dark font-medium">
                Discover fun, productivity, and experimental apps built by ${developer ? developer.name : 'a developer'}
            </p>
            <button 
                onclick="location.hash = '#apps'"
                class="px-8 py-4 rounded-xl font-bold text-lg transition duration-300 ease-in-out bg-accent-cta text-[#0F111A] shadow-lg hover:shadow-[0_0_20px_rgba(255,209,102,0.8)] hover:scale-[1.05]"
            >
                <i data-lucide="rocket" class="inline-block w-6 h-6 mr-2"></i>
                Browse Apps
            </button>
        </section>

        <!-- Featured App Highlight -->
        ${featuredApp ? `
        <section class="mb-16">
            <h2 class="text-3xl font-bold mb-8 dark:text-accent-primary">Featured App</h2>
            <div class="card-glass p-8 rounded-3xl grid md:grid-cols-2 gap-8 items-center shadow-soft-dark dark:shadow-neon-primary/30">
                <div class="order-2 md:order-1">
                    <h3 class="text-4xl font-extrabold mb-2">${featuredApp.name}</h3>
                    <p class="text-xl mb-4 dark:text-accent-primary">${featuredApp.tagline}</p>
                    <p class="dark:text-text-secondary-dark mb-6">${featuredApp.description.substring(0, 150)}...</p>
                    <div class="flex space-x-4">
                        <button 
                            onclick="location.hash = '#app/${featuredApp.id}'"
                            class="px-6 py-3 rounded-xl font-bold transition duration-200 bg-accent-primary text-[#0F111A] hover:shadow-neon-primary"
                        >
                            View Details
                        </button>
                        <span class="px-4 py-3 rounded-xl font-semibold mono dark:bg-card-dark/50 dark:text-accent-cta text-accent-cta">
                            <i data-lucide="download-cloud" class="w-4 h-4 inline-block mr-1"></i> ${humanReadableDownloads(featuredApp.downloads)}
                        </span>
                    </div>
                </div>
                <!-- Mockup Placeholder -->
                <div class="order-1 md:order-2 rounded-2xl overflow-hidden shadow-2xl transition duration-300 hover:scale-[1.01] bg-gray-900">
                    <img src="${featuredApp.screenshots[0] || 'https://placehold.co/800x450/1E1E2F/4AC0FF?text=App+Screenshot'}" class="w-full h-auto object-cover" alt="App Mockup">
                </div>
            </div>
        </section>
        ` : ''}
        
        <!-- Quick Categories Grid -->
        <section class="mb-16">
            <h2 class="text-3xl font-bold mb-8">Quick Categories</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                ${['Productivity', 'Fun', 'Tools', 'Experiments'].map((cat, index) => `
                    <div 
                        onclick="location.hash = '#apps/filter/${cat.toLowerCase()}'"
                        class="card-glass p-6 text-center rounded-2xl transition duration-300 transform hover:scale-[1.05] cursor-pointer shadow-soft-dark"
                        style="background-color: var(--tw-colors-pastel-${(index % 2) + 1})/20;"
                    >
                        <i data-lucide="${getCategoryIcon(cat)}" class="w-10 h-10 mx-auto mb-2 text-pastel-${(index % 2) + 1}"></i>
                        <p class="font-semibold text-lg dark:text-text-primary-dark">${cat}</p>
                    </div>
                `).join('')}
            </div>
        </section>

        <!-- Latest Updates Ticker -->
        ${updates.length > 0 ? `
        <section>
            <h2 class="text-3xl font-bold mb-8">Latest Updates</h2>
            <div class="flex overflow-x-auto space-x-4 pb-4 scrollbar-thin">
                ${updates.slice(0, 4).map(update => `
                    <div class="flex-shrink-0 w-80 card-glass p-4 rounded-xl shadow-soft-dark transition duration-300 hover:shadow-neon-primary/50">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-lg font-bold dark:text-accent-primary">${update.appName}</span>
                            <span class="mono text-sm dark:text-text-secondary-dark">${update.version}</span>
                        </div>
                        <p class="text-xs mb-2 dark:text-accent-secondary">${update.date}</p>
                        <p class="text-sm dark:text-text-secondary-dark line-clamp-2">Check out the latest updates for version ${update.version}.</p>
                    </div>
                `).join('')}
            </div>
        </section>
        ` : ''}
    `;
};

const renderAppsPage = (filter = 'all', sort = 'Newest', search = '') => {
    if (!isDataReady) return renderLoadingPage();

    let filteredApps = [...appsData]; // Create a shallow copy to avoid mutating the original sorted array

    // 1. Apply Category Filter
    if (filter && filter !== 'all' && filter !== 'Most Downloaded' && filter !== 'Newest') {
        filteredApps = filteredApps.filter(app => app.categoryId === filter);
    } 
    // 2. Apply Search Filter
    if (search) {
        const lowerSearch = search.toLowerCase();
        filteredApps = filteredApps.filter(app => 
            app.name.toLowerCase().includes(lowerSearch) || 
            app.tagline.toLowerCase().includes(lowerSearch) || // Search by category name too
            app.description.toLowerCase().includes(lowerSearch)
        );
    }
    // 3. Apply Sort Filter 
    if (sort === 'Most Downloaded') {
         filteredApps.sort((a, b) => b.downloads - a.downloads);
    } else if (sort === 'Newest') {
        // The initial data is sorted by releaseDate, but we re-sort to be explicit
        filteredApps.sort((a, b) => (b.releaseDate?.toMillis() || 0) - (a.releaseDate?.toMillis() || 0));
    }


    return `
        <h1 class="text-4xl md:text-5xl font-extrabold mb-8">The App Store</h1>

        <!-- Filter Bar -->
        <div class="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-10">
            <select id="category-filter" onchange="handleFilterChange()" class="card-glass p-3 rounded-xl dark:bg-card-dark dark:text-text-primary-dark border-2 border-accent-primary/50 focus:ring-accent-primary focus:border-accent-primary w-full sm:w-auto">
                <option value="all" ${filter === 'all' ? 'selected' : ''}>All Categories</option>
                ${[...new Map(appsData.map(app => [app.categoryId, app.categoryName]))]
                    .filter(([id, name]) => id && name && id !== 'N/A')
                    .map(([id, name]) => `<option value="${id}" ${id === filter ? 'selected' : ''}>${name}</option>`)
                    .join('')}
            </select>
            <select id="sort-filter" onchange="handleFilterChange()" class="card-glass p-3 rounded-xl dark:bg-card-dark dark:text-text-primary-dark border-2 border-accent-primary/50 focus:ring-accent-primary focus:border-accent-primary w-full sm:w-auto">
                <option value="Newest" ${sort === 'Newest' ? 'selected' : ''}>Sort by: Newest</option>
                <option value="Most Downloaded" ${sort === 'Most Downloaded' ? 'selected' : ''}>Sort by: Most Downloaded</option>
            </select>
            <input type="text" 
                   id="search-input"
                   placeholder="Search apps by name..." 
                   oninput="handleFilterChange()"
                   value="${search}"
                   class="card-glass p-3 rounded-xl dark:bg-card-dark dark:text-text-primary-dark border-2 border-accent-primary/50 focus:ring-accent-primary focus:border-accent-primary w-full sm:flex-grow">
        </div>

        <!-- App Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" id="app-grid">
            ${filteredApps.map(createAppCard).join('')}
            ${filteredApps.length === 0 ? `<p class="col-span-full text-center text-xl dark:text-text-secondary-dark p-10">No apps match your filter or search.</p>` : ''}
        </div>
    `;
};

const renderAppDetailPage = (app, changelog) => {
    let currentScreenshotIndex = 0;
    
    const updateScreenshot = (isLightbox = false) => {
        const screenshotUrl = app.screenshots[currentScreenshotIndex];
        if (isLightbox) {
            const lightboxImage = document.getElementById('lightbox-image');
            if (lightboxImage) lightboxImage.src = screenshotUrl || '';
        } else {
            const imgElement = document.getElementById('app-screenshot');
            if (!imgElement) return;

            imgElement.classList.add('opacity-0');
            setTimeout(() => {
                imgElement.src = screenshotUrl || 'https://placehold.co/800x600/1E1E2F/4AC0FF?text=No+Screenshot';
                // FIX: Update the onclick to open the correct image in the lightbox
                imgElement.setAttribute('onclick', `openLightbox('${screenshotUrl}')`);
                imgElement.classList.remove('opacity-0');
            }, 200); // Match transition duration
        }
    };

    window.nextScreenshot = (isLightbox = false) => {
        currentScreenshotIndex = (currentScreenshotIndex + 1) % app.screenshots.length;
        updateScreenshot(isLightbox);
    };
    window.prevScreenshot = (isLightbox = false) => {
        currentScreenshotIndex = (currentScreenshotIndex - 1 + app.screenshots.length) % app.screenshots.length;
        updateScreenshot(isLightbox);
    };


    return `
        <button onclick="location.hash = '#apps'" class="flex items-center dark:text-accent-secondary text-accent-secondary mb-8 transition hover:translate-x-[-4px]">
            <i data-lucide="chevron-left" class="w-5 h-5 mr-2"></i> Back to App Store
        </button>

        <div class="grid lg:grid-cols-3 gap-10">
            <!-- Main Info Column -->
            <div class="lg:col-span-2">
                <div class="flex items-center space-x-6 mb-6">
                    <div class="p-4 rounded-2xl bg-accent-primary/20 text-accent-primary dark:bg-accent-primary/20">
                        <i data-lucide="${app.icon}" class="w-12 h-12"></i>
                    </div>
                    <div>
                        <h1 class="text-4xl font-extrabold">${app.name}</h1>
                        <p class="text-xl dark:text-text-secondary-dark">${app.tagline}</p>
                    </div>
                </div>

                <!-- Screenshot Carousel -->
                <div class="relative mb-10 card-glass p-2 rounded-2xl shadow-soft-dark overflow-hidden aspect-[4/3] bg-black flex items-center justify-center">
                    <!-- Image at natural size, centered -->
                    <img 
                        id="app-screenshot"
                        src="${(app.screenshots && app.screenshots.length > 0) ? app.screenshots[0] : 'https://placehold.co/800x600/1E1E2F/4AC0FF?text=No+Screenshot'}" 
                        alt="App Screenshot" 
                        class="max-w-full max-h-full object-contain transition-opacity duration-200 ${(app.screenshots && app.screenshots.length > 0) ? 'cursor-zoom-in' : ''}"
                        onclick="${(app.screenshots && app.screenshots.length > 0) ? `openLightbox('${app.screenshots[0]}')` : ''}"
                    >
                    <!-- Navigation Arrows -->
                    ${(app.screenshots && app.screenshots.length > 1) ? `
                    <button onclick="prevScreenshot()" class="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/80 transition">
                        <i data-lucide="chevron-left" class="w-6 h-6"></i>
                    </button>
                    <button onclick="nextScreenshot()" class="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/80 transition">
                        <i data-lucide="chevron-right" class="w-6 h-6"></i>
                    </button>
                    ` : ''}
                </div>

                <!-- Description -->
                <h2 class="text-3xl font-bold mb-4">About the App</h2>
                <p class="dark:text-text-secondary-dark mb-10 whitespace-pre-line">${app.description}</p>

                <!-- Changelog / What's New -->
                <h2 class="text-3xl font-bold mb-4">What's New</h2>
                <div class="space-y-4">
                    ${changelog.length > 0 ? changelog.map(log => `
                        <div class="card-glass p-4 rounded-xl shadow-soft-dark">
                            <h4 class="font-bold text-lg dark:text-accent-primary">Version ${log.version} <span class="mono text-sm dark:text-text-secondary-dark font-normal">(${formatDate(log.date)})</span></h4>
                            <p class="dark:text-text-secondary-dark mt-1">${log.notes}</p>
                        </div>
                    `).join('') : '<p class="dark:text-text-secondary-dark">No changelog entries found yet.</p>'}
                </div>
            </div>

            <!-- Sidebar Column (Download & Stats) -->
            <div class="lg:col-span-1">
                <div class="sticky top-24 space-y-8">
                    <!-- Download Options -->
                    <div class="card-glass p-6 rounded-2xl shadow-soft-dark">
                        <h3 class="text-2xl font-bold mb-4">Download & Stats</h3>
                        <div class="space-y-4">
                            ${app.apkUrl ? `
                            <a href="${app.apkUrl}" download class="block" onclick="window.handleDownloadClick('${app.id}', event)">
                                <button class="w-full px-6 py-3 rounded-xl font-bold transition duration-300 bg-accent-cta text-[#0F111A] hover:shadow-[0_0_15px_rgba(255,209,102,0.7)] hover:scale-[1.01] flex items-center justify-center" type="button">
                                    <i data-lucide="download" class="w-5 h-5 mr-2"></i>
                                    Download APK
                                </button>
                            </a>
                            ` : ''}
                            ${app.playStoreUrl ? `
                            <a href="${app.playStoreUrl}" class="block" target="_blank" rel="noopener noreferrer">
                                <button class="w-full px-6 py-3 rounded-xl font-bold transition duration-300 border-2 border-accent-secondary text-accent-secondary hover:bg-accent-secondary/10 hover:shadow-[0_0_15px_rgba(255,107,107,0.5)] flex items-center justify-center">
                                    <i data-lucide="play" class="w-5 h-5 mr-2"></i>
                                    Get on Play Store
                                </button>
                            </a>
                            ` : ''}
                        </div>

                        <!-- Share Button -->
                        <button onclick="window.shareApp('${app.id}', '${app.name}')" class="w-full mt-4 px-6 py-2 rounded-xl font-semibold transition duration-300 border border-accent-primary text-accent-primary hover:bg-accent-primary/10 flex items-center justify-center">
                            <i data-lucide="share-2" class="w-5 h-5 mr-2"></i>
                            Share App
                        </button>
                        
                        <!-- Stats -->
                        <div class="mt-6 pt-4 border-t border-accent-primary/20 space-y-2 dark:text-text-secondary-dark">
                            <div class="flex justify-between items-center">
                                <span class="font-medium">Current Version:</span>
                                <span class="mono dark:text-text-primary-dark">${app.version}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="font-medium">Total Downloads:</span>
                                <span class="dark:text-text-primary-dark">${humanReadableDownloads(app.downloads)}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="font-medium">Release Date:</span>
                                <span class="dark:text-text-primary-dark">${formatDate(app.releaseDate)}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="font-medium">Rating:</span>
                                <span class="flex items-center space-x-1">${starRating(app.rating)} (${app.rating})</span>
                            </div>
                        </div>
                    </div>

                    <!-- User Rating Section -->
                    ${createUserRating(app.id, app.rating)}
                </div>
            </div>
        </div>
    `;
};

const renderAboutPage = () => {
    if (!isDataReady) return renderLoadingPage();

    if (!developer) {
        return `<div class="text-center p-20">
            <i data-lucide="user-x" class="w-16 h-16 mx-auto text-accent-secondary mb-4"></i>
            <h1 class="text-3xl font-bold mb-2">Developer Profile Missing</h1>
            <p class="dark:text-text-secondary-dark mb-6">The developer profile document at <code>artifacts/${appId}/public/data/developerProfile/profile</code> could not be loaded.</p>
        </div>`;
    }
    
    return `
        <div class="text-center mb-12">
            <h1 class="text-4xl md:text-6xl font-extrabold text-accent-primary mb-2">About ${developer.name}</h1>
            <p class="text-xl dark:text-text-secondary-dark">Developer | Cloud Security Enthusiast | Problem Solver</p>
        </div>

        <div class="card-glass p-8 md:p-12 rounded-3xl shadow-soft-dark dark:shadow-neon-primary/30">
            
            <!-- Profile & Bio -->
            <div class="flex flex-col md:flex-row items-start md:space-x-10">
                <!-- Profile Card -->
                <div class="w-full md:w-1/3 mb-8 md:mb-0 flex flex-col items-center">
                    <div class="w-48 h-48 rounded-full bg-accent-primary/20 p-2 mb-4 shadow-xl border-4 border-accent-primary/50 overflow-hidden">
                        <!-- Placeholder Image -->
                        <img src="${developer.profileImageUrl || `https://placehold.co/192x192/4AC0FF/0F111A?text=${developer.name.split(' ')[0]}`}" class="w-full h-full rounded-full object-cover" alt="${developer.name} Profile Photo">
                    </div>
                    <h3 class="text-2xl font-bold">${developer.name}</h3>
                    <p class="dark:text-text-secondary-dark">${developer.city}</p>
                    
                    <div class="mt-6 space-y-3 w-full">
                        ${developer.links.map(linkUrl => {
                            const link = getLinkDetails(linkUrl || '');
                            return `
                            <a href="${link.url}" target="_blank" class="flex items-center space-x-3 dark:text-text-primary-dark text-text-primary-light hover:text-accent-primary transition duration-200" aria-label="${link.label}">
                                <i data-lucide="${link.icon}" class="w-5 h-5 text-accent-primary stroke-accent-primary"></i>
                                <span>${link.label === link.url ? link.url.replace(/(^\w+:|^)\/\//, '') : link.label}</span>
                            </a>
                        `;}).join('')}
                    </div>
                </div>

                <!-- Bio and Skills -->
                <div class="w-full md:w-2/3">
                    <h2 class="text-3xl font-bold mb-4">My Journey & Philosophy</h2>
                    <!-- Use the bio directly from the developer object -->
                    <p class="dark:text-text-secondary-dark whitespace-pre-line mb-8">${developer.bio}</p>

                    <h2 class="text-3xl font-bold mb-4">Tech Stack & Skills</h2>
                    <div class="flex flex-wrap gap-3">
                        ${developer.skills.map(skill => `
                            <span class="px-4 py-2 rounded-full dark:bg-card-dark/70 dark:text-accent-cta text-accent-cta border border-accent-cta/50 mono text-sm shadow-inner">${skill}</span>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
};

const renderUpdatesPage = () => {
    if (!isDataReady) return renderLoadingPage();

    // We rely on the denormalized app data (version and releaseDate) which is already sorted.
    const allUpdates = appsData.map(app => ({
        ...app, // Pass the whole app object
    }));


    return `
        <h1 class="text-4xl md:text-5xl font-extrabold mb-8">Latest Updates & News</h1>
        <div class="space-y-6">
            ${allUpdates.map(update => `
                <div class="card-glass p-6 rounded-2xl shadow-soft-dark transition duration-300 hover:shadow-neon-primary/50 flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                        <h3 class="text-2xl font-bold dark:text-accent-primary mb-1">${update.name} updated to Version ${update.version}</h3>
                        <p class="dark:text-text-secondary-dark mb-3 md:mb-0">View the app details to see the full changelog.</p>
                        <span class="mono text-sm dark:text-accent-secondary">${formatDate(update.releaseDate)}</span>
                    </div>
                    <button onclick="location.hash = '#app/${update.id}'" class="mt-4 md:mt-0 px-4 py-2 rounded-lg font-semibold text-sm transition duration-200 border border-accent-primary text-accent-primary hover:bg-accent-primary/10">
                        View App
                    </button>
                </div>
            `).join('')}
        </div>
        ${allUpdates.length === 0 ? `<p class="text-center text-xl dark:text-text-secondary-dark p-10">No recent updates found.</p>` : ''}
    `;
};

const renderNotFoundPage = () => `
    <div class="text-center p-20">
        <i data-lucide="alert-triangle" class="w-16 h-16 mx-auto text-accent-secondary mb-4"></i>
        <h1 class="text-3xl font-bold mb-2">404 - Page Not Found</h1>
        <p class="dark:text-text-secondary-dark mb-6">Looks like that page is still in development or the URL is incorrect.</p>
        <button onclick="location.hash = '#home'" class="px-6 py-3 rounded-xl font-bold transition duration-200 bg-accent-primary text-[#0F111A] hover:shadow-neon-primary">Go to Home</button>
    </div>
`;

// --- MAIN NAVIGATION LOGIC ---

// This function is not directly used in the current HTML, but good to keep for consistency
const setActiveLink = (page) => {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('dark:text-accent-primary', 'text-accent-primary', 'font-extrabold', 'border-b-2', 'border-accent-primary');
        link.classList.add('dark:text-text-primary-dark/80', 'text-text-primary-light/80', 'hover:text-accent-primary');
    });

    // If we are on app-detail, highlight 'apps'
    const activePage = page === 'app-detail' ? 'apps' : page;
    const link = Array.from(document.querySelectorAll('.nav-link')).find(l => l.getAttribute('onclick').includes(`'${activePage}'`));
    
    if (link) {
        link.classList.add('dark:text-accent-primary', 'text-accent-primary', 'font-extrabold', 'border-b-2', 'border-accent-primary');
        link.classList.remove('dark:text-text-primary-dark/80', 'text-text-primary-light/80', 'hover:text-accent-primary');
    }
};

const showPage = (page, options = {}, shouldScroll = true) => {
    const { filter, sort } = options;

    // Update state only if new values are provided
    const newFilter = filter !== undefined ? filter.toLowerCase() : currentFilter;
    const newSort = sort !== undefined ? sort : currentSort;

    if (page !== currentPage || newFilter !== currentFilter || newSort !== currentSort) {
        currentPage = page;
        currentFilter = newFilter;
        currentSort = newSort;
    }

    if (!isDataReady && page !== 'loading') {
        contentDiv.innerHTML = renderLoadingPage();
        lucide.createIcons();
        return;
    }

    contentDiv.classList.add('opacity-0'); 

    setTimeout(() => {
        let html = renderNotFoundPage();

        switch (page) {
            case 'home':
                html = renderHomePage();
                break;
            case 'apps':
                html = renderAppsPage(currentFilter, currentSort, currentSearch); 
                break;
            case 'about':
                html = renderAboutPage();
                break;
            case 'updates':
                html = renderUpdatesPage();
                break;
            default:
                if (page === 'app-detail' && selectedAppId) {
                    // If we re-render on a detail page (e.g., due to background data update), re-call the async function
                    showAppDetail(selectedAppId, true); 
                    return; // Stop the synchronous render flow
                }
                html = renderNotFoundPage();
        }
        
        contentDiv.innerHTML = html;
        lucide.createIcons();
        setActiveLink(page);
        contentDiv.classList.remove('opacity-0'); // End fade in

        if (shouldScroll) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, 300); 
};

/**
 * New handler to read filter values directly from the DOM, resolving the ReferenceError.
 */
window.handleFilterChange = () => {
    const filterElement = document.getElementById('category-filter');
    const sortElement = document.getElementById('sort-filter');
    const searchElement = document.getElementById('search-input');

    // Fallback for safety, though these should exist if the page is rendered
    const filterValue = filterElement ? filterElement.value : currentFilter;
    const sortValue = sortElement ? sortElement.value : currentSort;
    const searchValue = searchElement ? searchElement.value : currentSearch;
    
    filterApps(filterValue, sortValue, searchValue);
};


/**
 * Fetches changelog data for a specific app asynchronously and renders the detail page.
 */
const showAppDetail = async (appId, isReRender = false) => { // isReRender is not used, but kept for signature consistency
    selectedAppId = appId;
    currentPage = 'app-detail';

    if (!isReRender) {
        // Show a brief loading indicator/placeholder for the asynchronous fetch
        contentDiv.classList.add('opacity-0');
        
        setTimeout(() => {
             contentDiv.innerHTML = `<div class="text-center p-20"><div class="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 dark:border-card-dark h-10 w-10 mb-4 inline-block"></div><p>Loading app details...</p></div>`;
             lucide.createIcons();
             contentDiv.classList.remove('opacity-0');
        }, 300);
    }

    const app = appsData.find(a => a.id === appId);
    if (!app) {
        showPage('apps');
        return;
    }

    // 1. Fetch Changelog Subcollection
    let changelog = [];
    try {
        const changelogCollectionRef = collection(db, `artifacts/${appId}/public/data/apps/${appId}/changelog`);
        // Query for changelog entries, ordered by date descending
        const changelogQuery = query(changelogCollectionRef, orderBy('date', 'desc')); 
        const changelogSnapshot = await getDocs(changelogQuery);

        changelog = changelogSnapshot.docs.map(doc => doc.data());

    } catch (error) {
        console.error("Error fetching changelog:", error);
        // Continue with an empty changelog array if fetch fails
    }

    // 2. Render Page with Full Data
    contentDiv.classList.add('opacity-0');

    setTimeout(() => {
        contentDiv.innerHTML = renderAppDetailPage(app, changelog);
        lucide.createIcons();
        setActiveLink('app-detail'); 
        contentDiv.classList.remove('opacity-0');
    }, 300);
    
    if (!isReRender) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

const filterApps = (filter, sort, search) => {
    currentFilter = filter;
    currentSort = sort;
    currentSearch = search;
    showPage('apps', { filter, sort }, false); 
};

// --- ROUTING LOGIC ---
const handleRouting = () => {
    const hash = window.location.hash || '#home';
    const [path, ...params] = hash.substring(1).split('/');

    switch (path) {
        case 'home':
            showPage('home');
            break;
        case 'apps':
            const filter = params[0] === 'filter' ? params[1] : 'all';
            showPage('apps', { filter: filter });
            break;
        case 'updates':
            showPage('updates');
            break;
        case 'about':
            showPage('about');
            break;
        case 'app':
            const appId = params[0];
            if (appId) {
                showAppDetail(appId);
            } else {
                showPage('apps');
            }
            break;
        default:
            showPage('home'); // Fallback to home
    }
};

// --- DYNAMIC USER ACTIONS ---

window.submitRating = async (appId, rating) => {
    const ratedApps = JSON.parse(localStorage.getItem('ratedApps') || '{}');
    if (ratedApps[appId]) {
        return alertMessage('You have already rated this app.', 'error');
    }

    const appRef = doc(db, `artifacts/${appId}/public/data/apps/${appId}`);

    try {
        await runTransaction(db, async (transaction) => {
            const appDoc = await transaction.get(appRef);
            if (!appDoc.exists()) {
                throw "App document does not exist!";
            }

            const data = appDoc.data();
            const newRatingCount = (data.ratingCount || 0) + 1;
            const newRatingSum = (data.ratingSum || 0) + rating;
            const newAverageRating = newRatingSum / newRatingCount;

            transaction.update(appRef, { 
                ratingCount: newRatingCount,
                ratingSum: newRatingSum,
                rating: newAverageRating
            });
        });

        ratedApps[appId] = true;
        localStorage.setItem('ratedApps', JSON.stringify(ratedApps));
        alertMessage(`Thank you for rating ${rating} stars!`, 'success');
        showAppDetail(appId, true); // Re-render the page to update UI

    } catch (error) {
        console.error("Rating transaction failed: ", error);
        alertMessage("Could not submit rating. Please try again.", 'error');
    }
};

window.handleDownloadClick = async (appId, event) => {
    alertMessage('Download started! Check your notifications or downloads folder to install.', 'info');
    
    // --- Frontend Download Counter ---
    // WARNING: This is not a secure method for counting downloads as it can be triggered
    // multiple times by a single user. The recommended approach is a Firebase Function.
    // However, for a portfolio site, this is a practical implementation.
    const appRef = doc(db, `artifacts/${appId}/public/data/apps/${appId}`);
    try {
        await runTransaction(db, async (transaction) => {
            const appDoc = await transaction.get(appRef);
            if (!appDoc.exists()) {
                throw "App document not found!";
            }
            const newDownloads = (appDoc.data().downloads || 0) + 1;
            transaction.update(appRef, { downloads: newDownloads });
        });
        console.log(`Successfully incremented download count for ${appId}`);
    } catch (error) {
        console.error("Failed to increment download count:", error);
    }
};

window.shareApp = async (appId, appName) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#app/${appId}`;
    const shareData = {
        title: `Check out ${appName} on CodeByKavin`,
        text: `I found this cool app, ${appName}, on Kavin's personal app store!`,
        url: shareUrl,
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
            alertMessage('Thanks for sharing!', 'success');
        } catch (err) {
            console.error('Share failed:', err);
        }
    } else {
        // Fallback for desktop: copy link to clipboard
        navigator.clipboard.writeText(shareUrl);
        alertMessage('Link copied to clipboard!', 'info');
    }
};

// Initial content rendering: show loading spinner until Firebase data is ready
window.onload = () => {
    lucide.createIcons();
    contentDiv.innerHTML = renderLoadingPage();
    initFirebase();
    window.addEventListener('hashchange', handleRouting);
};
