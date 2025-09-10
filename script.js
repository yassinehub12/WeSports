// ======================= VARIABLES =======================
let video = document.getElementById('video');
let videoSource = document.getElementById('videoSource');
let qualitySelect = document.getElementById('quality');
let serverSelect = document.getElementById('server');
let fullscreenBtn = document.getElementById('fullscreen');
let reportBtn = document.getElementById('reportBtn');
let errorMessage = document.getElementById('errorMessage');
let translations = {
    en: {
        login: "Login",
        signup: "Sign Up",
        email: "Email",
        password: "Password",
        forgotPassword: "Forgot Password?",
        backToLogin: "Back to Login",
        logout: "Logout",
        loading: "Loading matches...",
        error: "Error loading matches.",
        selectMatch: "Select a match to watch"
    },
    ar: {
        login: "تسجيل الدخول",
        signup: "إنشاء حساب",
        email: "البريد الإلكتروني",
        password: "كلمة المرور",
        forgotPassword: "نسيت كلمة المرور؟",
        backToLogin: "العودة لتسجيل الدخول",
        logout: "تسجيل الخروج",
        loading: "جاري تحميل المباريات...",
        error: "حدث خطأ أثناء تحميل المباريات.",
        selectMatch: "اختر مباراة للمشاهدة"
    },
    fr: {
        login: "Connexion",
        signup: "Créer un compte",
        email: "E-mail",
        password: "Mot de passe",
        forgotPassword: "Mot de passe oublié ?",
        backToLogin: "Retour à la connexion",
        logout: "Se déconnecter",
        loading: "Chargement des matchs...",
        error: "Erreur lors du chargement des matchs.",
        selectMatch: "Sélectionnez un match à regarder"
    }
};

// ======================= AUTH VARIABLES =======================
let authModal = document.getElementById('authModal');
let authClose = document.getElementById('authClose');
let authTabs = document.querySelectorAll('.auth-tab');
let authForms = document.querySelectorAll('.auth-form');
let loginForm = document.getElementById('loginForm');
let signupForm = document.getElementById('signupForm');
let forgotPasswordForm = document.getElementById('forgotPasswordForm');
let forgotPasswordLink = document.getElementById('forgotPassword');
let backToLoginLink = document.getElementById('backToLogin');
let authError = document.createElement('div');
let authSuccess = document.createElement('div');

// ======================= FIREBASE CONFIG =======================
const firebaseConfig = {
    apiKey: "AIzaSyB-kJ0dNGFeEVmXbXD6zmrgZD1KUwFuHwo",
    authDomain: "database-maroc.firebaseapp.com",
    projectId: "database-maroc",
    storageBucket: "database-maroc.firebasestorage.app",
    messagingSenderId: "59418874824",
    appId: "1:59418874824:web:8075a756e030d6d138e6fd",
    measurementId: "G-SJ9T15LQPL"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// ======================= INIT AUTH =======================
function initAuth() {
    authError.className = 'auth-message error-message';
    authSuccess.className = 'auth-message success-message';

    loginForm.appendChild(authError);
    loginForm.appendChild(authSuccess);

    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            authForms.forEach(form => form.classList.remove('active'));
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    authClose.onclick = () => { authModal.style.display = "none"; };

    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        authForms.forEach(form => form.classList.remove('active'));
        forgotPasswordForm.classList.add('active');
    });

    backToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        authForms.forEach(form => form.classList.remove('active'));
        loginForm.classList.add('active');
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = loginForm['loginEmail'].value;
        const password = loginForm['loginPassword'].value;
        auth.signInWithEmailAndPassword(email, password)
            .then(() => { showSuccess("Login successful!"); hideAuthModal(); })
            .catch(err => showError(err.message));
    });

    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = signupForm['signupEmail'].value;
        const password = signupForm['signupPassword'].value;
        auth.createUserWithEmailAndPassword(email, password)
            .then(() => { showSuccess("Account created successfully!"); hideAuthModal(); })
            .catch(err => showError(err.message));
    });

    forgotPasswordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = forgotPasswordForm['resetEmail'].value;
        auth.sendPasswordResetEmail(email)
            .then(() => { showSuccess("Password reset email sent!"); })
            .catch(err => showError(err.message));
    });

    auth.onAuthStateChanged(user => {
        if (user) {
            document.querySelector('.app-container').style.display = 'block';
            authModal.style.display = 'none';
        } else {
            document.querySelector('.app-container').style.display = 'none';
            authModal.style.display = 'flex';
        }
    });
}

function showError(message) {
    authError.textContent = message;
    authError.style.display = 'block';
    authSuccess.style.display = 'none';
}

function showSuccess(message) {
    authSuccess.textContent = message;
    authSuccess.style.display = 'block';
    authError.style.display = 'none';
}

function hideAuthModal() {
    setTimeout(() => {
        authModal.style.display = 'none';
    }, 1000);
}

// ======================= VIDEO FUNCTIONS =======================
function changeLanguage(lang) {
    document.querySelectorAll("[data-translate]").forEach(el => {
        let key = el.getAttribute("data-translate");
        if (translations[lang][key]) el.textContent = translations[lang][key];
    });
}

function initEvents() {
    fullscreenBtn.addEventListener('click', () => {
        if (video.requestFullscreen) video.requestFullscreen();
        else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
        else if (video.msRequestFullscreen) video.msRequestFullscreen();
    });
}

function setupReportButton() {
    reportBtn.addEventListener('click', () => {
        alert("Report sent!");
    });
}

function fetchMatches() {
    errorMessage.textContent = translations['en'].loading;
    setTimeout(() => {
        errorMessage.textContent = translations['en'].selectMatch;
    }, 1500);
}

// ======================= INIT =======================
initEvents();
setupReportButton();
fetchMatches();
initAuth();