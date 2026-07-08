const API_BASE = "https://startupforge-os-production.up.railway.app";
const WS_BASE =
    "wss://startupforge-os-production.up.railway.app";
let marketChartInstance = null;
let revenueChartInstance = null;
let currentTaskId = null;
let animationId = null;

// Operating System state variables
let projectResults = null;
let currentSlideIndex = 0;
let workflowStage = 1;
let chosenBrandName = "";
let chosenPricingModel = "";
let versionLogs = [];

// Currency Converter state
let activeCurrencySymbol = '$';
let activeCurrencyRate = 1.0;

// User Session and Credentials state
let currentUserId = localStorage.getItem('startupforge_user_id') || null;
let currentUser = null;
if (currentUserId) {
    currentUser = {
        id: parseInt(currentUserId),
        name: localStorage.getItem('startupforge_user_name') || "Developer User",
        email: localStorage.getItem('startupforge_user_email') || "",
        mobile: localStorage.getItem('startupforge_user_mobile') || ""
    };
}
let gitHubToken = localStorage.getItem('startupforge_github_token') || "";
let vercelToken = localStorage.getItem('startupforge_vercel_token') || "";
let supabaseToken = localStorage.getItem('startupforge_supabase_token') || "";

// ==================== AUTH PORTAL & SESSION LOGIC ====================
const authPortal = document.getElementById('auth-portal');
const appWrapper = document.getElementById('app-wrapper');

// Tab toggles
const tabLoginBtn = document.getElementById('tab-login-btn');
const tabRegisterBtn = document.getElementById('tab-register-btn');
const loginFormContainer = document.getElementById('login-form-container');
const registerFormContainer = document.getElementById('register-form-container');
const forgotFormContainer = document.getElementById('forgot-form-container');
const verifyFormContainer = document.getElementById('verify-form-container');

tabLoginBtn.addEventListener('click', () => {
    tabLoginBtn.classList.add('active');
    tabRegisterBtn.classList.remove('active');
    loginFormContainer.classList.add('active');
    registerFormContainer.classList.remove('active');
    forgotFormContainer.classList.remove('active');
    verifyFormContainer.classList.remove('active');
});

tabRegisterBtn.addEventListener('click', () => {
    tabRegisterBtn.classList.add('active');
    tabLoginBtn.classList.remove('active');
    registerFormContainer.classList.add('active');
    loginFormContainer.classList.remove('active');
    forgotFormContainer.classList.remove('active');
    verifyFormContainer.classList.remove('active');
});

// Forgot Password flows
document.getElementById('forgot-password-btn').addEventListener('click', () => {
    loginFormContainer.classList.remove('active');
    registerFormContainer.classList.remove('active');
    forgotFormContainer.classList.add('active');
    verifyFormContainer.classList.remove('active');
});

document.getElementById('back-to-login-btn').addEventListener('click', () => {
    forgotFormContainer.classList.remove('active');
    loginFormContainer.classList.add('active');
});

// Forgot Form Submit -> Go to OTP Verification
document.getElementById('forgot-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const targetVal = document.getElementById('forgot-identifier').value.trim();
    if (!targetVal) return;

    alert(`Verification recover OTP code sent successfully to ${targetVal}`);
    forgotFormContainer.classList.remove('active');
    verifyFormContainer.classList.add('active');

    const otpDigits = document.querySelectorAll('.otp-digit');
    if (otpDigits.length > 0) otpDigits[0].focus();
});

// OTP Digit inputs auto-jumping layout focus loops
const otpDigits = document.querySelectorAll('.otp-digit');
otpDigits.forEach((input, index) => {
    input.addEventListener('keyup', (e) => {
        if (e.target.value.length === 1 && index < otpDigits.length - 1) {
            otpDigits[index + 1].focus();
        }
        if (e.key === 'Backspace' && index > 0 && e.target.value.length === 0) {
            otpDigits[index - 1].focus();
        }
    });
});

// OTP Form Submit
document.getElementById('verify-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const code = Array.from(otpDigits).map(input => input.value).join('');
    if (code.length !== 6) {
        alert('Please enter complete 6-digit verification code.');
        return;
    }

    alert('OTP Verified!');
    loginUser("Verified User", "verified@example.com", "+919876543210");
});

// Handle Login submit
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const identifier = document.getElementById('login-identifier').value.trim();
    const pass = document.getElementById('login-password').value;

    if (pass.length < 6) {
        alert('Password must be at least 6 characters.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: identifier, password: pass })
        });

        const data = await response.json();
        if (!response.ok) {
            alert(data.detail || 'Login failed.');
            return;
        }

        // Save token state locally
        gitHubToken = data.user.github_token;
        vercelToken = data.user.vercel_token;
        supabaseToken = data.user.supabase_token;

        localStorage.setItem('startupforge_github_token', gitHubToken);
        localStorage.setItem('startupforge_vercel_token', vercelToken);
        localStorage.setItem('startupforge_supabase_token', supabaseToken);

        loginUser(data.user.name, data.user.email, data.user.mobile, data.user.id);
        alert('Signed in successfully!');

    } catch (err) {
        console.error(err);
        alert('Server connection error. Please verify the backend is active.');
    }
});

// Handle Registration submit
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const mobile = document.getElementById('reg-mobile').value.trim();
    const pass = document.getElementById('reg-password').value;

    if (pass.length < 6) {
        alert('Password must be at least 6 characters.');
        return;
    }

    // Get credentials tokens
    const githubInput = document.getElementById('reg-github-token').value.trim();
    const vercelInput = document.getElementById('reg-vercel-token').value.trim();
    const supabaseInput = document.getElementById('reg-supabase-token').value.trim();

    if (!githubInput) {
        alert('GitHub Access Token is compulsory to launch repository scaffolds.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/v1/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                email: email,
                mobile: mobile,
                password: pass,
                github_token: githubInput,
                vercel_token: vercelInput,
                supabase_token: supabaseInput
            })
        });

        const data = await response.json();
        if (!response.ok) {
            alert(data.detail || 'Registration failed.');
            return;
        }

        // Save locally
        gitHubToken = githubInput;
        vercelToken = vercelInput;
        supabaseToken = supabaseInput;

        localStorage.setItem('startupforge_github_token', githubInput);
        localStorage.setItem('startupforge_vercel_token', vercelInput);
        localStorage.setItem('startupforge_supabase_token', supabaseInput);

        alert('Account created and credentials registered successfully!');
        loginUser(name, email, mobile, data.user_id);

    } catch (err) {
        console.error(err);
        alert('Server connection error during registration.');
    }
});

function loginUser(name, email, mobile, userId) {
    currentUser = { id: userId, name, email, mobile };
    currentUserId = userId;

    localStorage.setItem('startupforge_user_id', userId);
    localStorage.setItem('startupforge_user_name', name);
    localStorage.setItem('startupforge_user_email', email);
    localStorage.setItem('startupforge_user_mobile', mobile);

    authPortal.classList.add('hidden');
    appWrapper.classList.remove('hidden');

    document.getElementById('user-display-name').textContent = name;

    document.getElementById('update-github-token').value = gitHubToken;
    document.getElementById('update-vercel-token').value = vercelToken;
    document.getElementById('update-supabase-token').value = supabaseToken;
}

// Logout button
document.getElementById('logout-btn').addEventListener('click', () => {
    currentUser = null;
    currentUserId = null;
    localStorage.clear(); // Clear all user keys

    authPortal.classList.remove('hidden');
    appWrapper.classList.add('hidden');

    document.getElementById('login-identifier').value = "";
    document.getElementById('login-password').value = "";
    otpDigits.forEach(input => input.value = "");
});

// ==================== CREDENTIALS MODAL OVERLAYS ====================
const credentialsModal = document.getElementById('credentials-modal');

document.getElementById('user-badge-btn').addEventListener('click', () => {
    credentialsModal.classList.remove('hidden');
    document.getElementById('update-github-token').value = gitHubToken;
    document.getElementById('update-vercel-token').value = vercelToken;
    document.getElementById('update-supabase-token').value = supabaseToken;
});

document.getElementById('close-modal-btn').addEventListener('click', () => {
    credentialsModal.classList.add('hidden');
});

credentialsModal.addEventListener('click', (e) => {
    if (e.target === credentialsModal) {
        credentialsModal.classList.add('hidden');
    }
});

document.getElementById('credentials-update-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const githubVal = document.getElementById('update-github-token').value.trim();
    const vercelVal = document.getElementById('update-vercel-token').value.trim();
    const supabaseVal = document.getElementById('update-supabase-token').value.trim();

    if (!githubVal) {
        alert('GitHub Access Token is required.');
        return;
    }

    if (!currentUserId) {
        alert('You must be signed in to update credentials.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/v1/auth/update-credentials`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: parseInt(currentUserId),
                github_token: githubVal,
                vercel_token: vercelVal,
                supabase_token: supabaseVal
            })
        });

        const data = await response.json();
        if (!response.ok) {
            alert(data.detail || 'Failed to update credentials.');
            return;
        }

        gitHubToken = githubVal;
        localStorage.setItem('startupforge_github_token', githubVal);

        vercelToken = vercelVal;
        localStorage.setItem('startupforge_vercel_token', vercelVal);

        supabaseToken = supabaseVal;
        localStorage.setItem('startupforge_supabase_token', supabaseVal);

        alert('Credentials updated successfully in database!');
        credentialsModal.classList.add('hidden');

    } catch (err) {
        console.error(err);
        alert('Server connection error during credentials update.');
    }
});

// ==================== APP DASHBOARD INTERACTIVE ACTIONS ====================
// Voice Recognition Integration
const voiceBtn = document.getElementById('voice-btn');
const voiceStatus = document.getElementById('voice-status');
const ideaInput = document.getElementById('idea-input');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    voiceBtn.addEventListener('click', () => {
        if (voiceBtn.classList.contains('recording')) {
            recognition.stop();
        } else {
            voiceBtn.classList.add('recording');
            voiceStatus.classList.remove('hidden');
            voiceStatus.textContent = 'Listening... Speak your startup idea now.';
            recognition.start();
        }
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        ideaInput.value = transcript;
        voiceStatus.textContent = 'Speech recognized successfully!';
        setTimeout(() => voiceStatus.classList.add('hidden'), 2000);
    };

    recognition.onspeechend = () => {
        recognition.stop();
    };

    recognition.onerror = (event) => {
        console.error('Speech error:', event.error);
        voiceStatus.textContent = `Voice error: ${event.error}`;
        setTimeout(() => voiceStatus.classList.add('hidden'), 2500);
        voiceBtn.classList.remove('recording');
    };

    recognition.onend = () => {
        voiceBtn.classList.remove('recording');
    };
} else {
    voiceBtn.style.display = 'none';
}

// IP-based Currency / GeoLocation Detection on load
window.addEventListener('load', async () => {
    const geoBadge = document.getElementById('geo-badge');
    const selector = document.getElementById('region-selector');

    // Auto-login session restore
    if (currentUser) {
        loginUser(currentUser.name, currentUser.email, currentUser.mobile, currentUser.id);
    }

    try {
        geoBadge.textContent = 'Detecting Region...';
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('IP API error');

        const ipData = await response.json();
        const country = ipData.country_code;
        const currency = ipData.currency;

        if (country === 'IN' || currency === 'INR') {
            selector.value = 'IN';
            geoBadge.textContent = `📍 India (INR)`;
        } else if (['FR', 'DE', 'IT', 'ES', 'NL', 'BE'].includes(country) || currency === 'EUR') {
            selector.value = 'EU';
            geoBadge.textContent = `📍 Europe (EUR)`;
        } else if (country === 'GB' || currency === 'GBP') {
            selector.value = 'GB';
            geoBadge.textContent = `📍 United Kingdom (GBP)`;
        } else {
            selector.value = 'US';
            geoBadge.textContent = `📍 United States (USD)`;
        }

        updateCurrencyConfig();
    } catch (err) {
        console.error('IP location error:', err);
        selector.value = 'US';
        geoBadge.textContent = '📍 United States (USD)';
        updateCurrencyConfig();
    }
});

// GPS Button Trigger
document.getElementById('gps-btn').addEventListener('click', () => {
    const gpsBtn = document.getElementById('gps-btn');
    const geoBadge = document.getElementById('geo-badge');

    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
    }

    gpsBtn.classList.add('locating');
    geoBadge.textContent = 'Locating via GPS...';

    navigator.geolocation.getCurrentPosition(
        (position) => {
            gpsBtn.classList.remove('locating');
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            const selector = document.getElementById('region-selector');
            if (lat > 5 && lat < 38 && lon > 68 && lon < 97) {
                selector.value = 'IN';
                geoBadge.textContent = `📍 GPS: India (₹)`;
            } else if (lat > 35 && lat < 70 && lon > -10 && lon < 30) {
                selector.value = 'EU';
                geoBadge.textContent = `📍 GPS: Europe (€)`;
            } else if (lat > 49 && lat < 60 && lon > -8 && lon < 2) {
                selector.value = 'GB';
                geoBadge.textContent = `📍 GPS: UK (£)`;
            } else {
                selector.value = 'US';
                geoBadge.textContent = `📍 GPS: United States ($)`;
            }

            updateCurrencyConfig();
            if (projectResults) {
                renderDashboard(projectResults);
            }
        },
        (error) => {
            console.error('GPS Geolocation Error:', error);
            gpsBtn.classList.remove('locating');
            geoBadge.textContent = 'GPS Scan Failed';
            setTimeout(() => {
                geoBadge.textContent = '📍 Default: US ($)';
            }, 2000);
        }
    );
});

// Select Dropdown event
document.getElementById('region-selector').addEventListener('change', () => {
    updateCurrencyConfig();
    const selector = document.getElementById('region-selector');
    const badge = document.getElementById('geo-badge');
    const selectedOption = selector.options[selector.selectedIndex];
    badge.textContent = `📍 Manual: ${selectedOption.text.split(' ')[0]}`;

    if (projectResults) {
        renderDashboard(projectResults);
    }
});

function updateCurrencyConfig() {
    const selector = document.getElementById('region-selector');
    const selectedOption = selector.options[selector.selectedIndex];

    activeCurrencySymbol = selectedOption.getAttribute('data-symbol');
    activeCurrencyRate = parseFloat(selectedOption.getAttribute('data-rate'));
}

// Convert monetary USD float/string dynamically
function formatCurrency(usdValueRaw) {
    const usdVal = parseFloat(usdValueRaw.toString().replace(/[^0-9.]/g, ''));
    if (isNaN(usdVal)) return usdValueRaw;

    const converted = usdVal * activeCurrencyRate;

    if (converted >= 1000) {
        return `${activeCurrencySymbol}${parseInt(converted).toLocaleString()}`;
    }
    return `${activeCurrencySymbol}${converted.toFixed(2)}`;
}

// Ideation Form Submission
document.getElementById('idea-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const ideaInputVal = ideaInput.value.trim();
    if (!ideaInputVal) return;

    const submitBtn = document.getElementById('submit-btn');
    const consoleSection = document.getElementById('console-section');
    const consoleLogs = document.getElementById('console-logs');
    const dashboardWrapper = document.getElementById('dashboard-wrapper');
    const workflowProgressSec = document.getElementById('workflow-progress-sec');
    const orchestrationStatus = document.getElementById('orchestration-status');

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Forging startup...</span> <i class="fa-solid fa-spinner fa-spin"></i>';

    consoleLogs.innerHTML = '';
    consoleSection.classList.remove('hidden');
    dashboardWrapper.classList.add('hidden');
    workflowProgressSec.classList.add('hidden');
    orchestrationStatus.textContent = 'Contacting server...';
    orchestrationStatus.className = 'status-badge';

    if (animationId) {
        cancelAnimationFrame(animationId);
    }

    try {
        const response = await fetch(`${API_BASE}/api/v1/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idea: ideaInputVal })
        });

        if (!response.ok) {
            throw new Error('API server returned an error');
        }

        const data = await response.json();
        currentTaskId = data.task_id;

        connectWebSocket(currentTaskId);

    } catch (err) {
        console.error(err);
        appendLog('orchestrator', 'Failed to connect to API server. Ensure backend is running.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Forge Startup OS</span> <i class="fa-solid fa-wand-magic-sparkles"></i>';
        orchestrationStatus.textContent = 'Failed';
        orchestrationStatus.className = 'status-badge error';
    }
});

function connectWebSocket(taskId) {

    const WS_BASE = API_BASE
        .replace("https://", "wss://")
        .replace("http://", "ws://");

    const ws = new WebSocket(`${WS_BASE}/ws/logs/${taskId}`);

    const orchestrationStatus =
        document.getElementById("orchestration-status");

    orchestrationStatus.textContent = "Agents running";

    ws.onopen = () => {
        console.log("WebSocket Connected");
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.status === "completed") {
            orchestrationStatus.textContent = "Completed";
            orchestrationStatus.className = "status-badge success";
            ws.close();
            fetchResults(taskId);
        } else if (data.agent && data.message) {
            appendLog(data.agent, data.message);
        }
    };

    ws.onerror = (err) => {
        console.error("WebSocket Error:", err);
        appendLog("orchestrator", "WebSocket connection failed.");
    };

    ws.onclose = () => {
        console.log("WebSocket Closed");
    };
}

function appendLog(agent, message) {
    const consoleLogs = document.getElementById('console-logs');
    const logDiv = document.createElement('div');
    logDiv.className = 'log-entry';

    const agentLabels = {
        orchestrator: 'Orchestrator',
        market_research: 'Market Researcher',
        finance: 'Finance Agent',
        branding: 'Branding Agent',
        investor: 'Investor Agent'
    };

    const agentClass = agent.toLowerCase();
    const agentName = agentLabels[agentClass] || agent;

    logDiv.innerHTML = `
        <span class="log-agent ${agentClass}">[${agentName}]</span>
        <span class="log-message">${escapeHTML(message)}</span>
    `;
    consoleLogs.appendChild(logDiv);
    consoleLogs.scrollTop = consoleLogs.scrollHeight;
}

async function fetchResults(taskId) {
    const response = await fetch(`${API_BASE}/api/v1/results/${taskId}`);
    const resData = await response.json();

    if (resData.status === 'completed') {
        projectResults = resData.data;

        workflowStage = 1;
        chosenBrandName = "";
        chosenPricingModel = "";
        versionLogs = [`v1.0.0: Initialized validation audit for "${projectResults.name}"`];

        document.getElementById('workflow-progress-sec').classList.remove('hidden');
        renderDashboard(projectResults);
        triggerHITLApproval();
    } else {
        appendLog('orchestrator', 'Failed to retrieve results from task store.');
    }

    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span>Forge Startup OS</span> <i class="fa-solid fa-wand-magic-sparkles"></i>';
}

// Guided Workflow Stages and HITL Logic
function triggerHITLApproval() {
    const hitlContainer = document.getElementById('hitl-container');
    const hitlContent = document.getElementById('hitl-action-content');

    hitlContainer.classList.remove('hidden');
    hitlContent.innerHTML = '';

    updateWorkflowActiveStep();

    if (workflowStage === 1) {
        hitlContent.innerHTML = `
            <div class="hitl-prompt"><strong>Orchestrator</strong>: Validation testing score is ${projectResults.investor.readiness_score}/100. Approve analysis to unlock Market Research?</div>
            <button class="btn btn-primary btn-sm" id="hitl-approve-btn">Approve & Proceed</button>
        `;
        document.getElementById('hitl-approve-btn').addEventListener('click', () => {
            workflowStage = 2;
            versionLogs.push(`v1.1.0: Approved startup viability testing reports.`);
            updateVersionHistory();
            triggerHITLApproval();
        });

    } else if (workflowStage === 2) {
        hitlContent.innerHTML = `
            <div class="hitl-prompt"><strong>Market Analyst</strong>: Competitor lists and TAM/SAM/SOM estimations completed. Approve competitor report?</div>
            <button class="btn btn-primary btn-sm" id="hitl-approve-btn">Approve & Open Branding</button>
        `;
        document.getElementById('hitl-approve-btn').addEventListener('click', () => {
            workflowStage = 3;
            versionLogs.push(`v1.2.0: Approved competitor mapping reports.`);
            updateVersionHistory();
            triggerHITLApproval();
        });

    } else if (workflowStage === 3) {
        const opt1 = projectResults.name;
        const opt2 = `${opt1}Hub`;
        const opt3 = `Get${opt1}`;
        hitlContent.innerHTML = `
            <div class="hitl-prompt"><strong>Creative Director</strong>: Branding generated. Select your target startup name to proceed:</div>
            <button class="hitl-btn-option" data-name="${opt1}">${opt1}</button>
            <button class="hitl-btn-option" data-name="${opt2}">${opt2}</button>
            <button class="hitl-btn-option" data-name="${opt3}">${opt3}</button>
        `;
        document.querySelectorAll('.hitl-btn-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                chosenBrandName = e.target.dataset.name;
                projectResults.name = chosenBrandName;
                workflowStage = 4;
                versionLogs.push(`v1.3.0: Selected brand identity name: "${chosenBrandName}"`);
                updateVersionHistory();
                renderDashboard(projectResults);
                triggerHITLApproval();
            });
        });

    } else if (workflowStage === 4) {
        hitlContent.innerHTML = `
            <div class="hitl-prompt"><strong>Pricing Agent</strong>: Select your baseline business model strategy:</div>
            <button class="hitl-btn-option" data-model="SaaS Subscription">SaaS Subscription (Starter/Growth)</button>
            <button class="hitl-btn-option" data-model="Freemium model">Freemium Tier Model</button>
            <button class="hitl-btn-option" data-model="Usage-based">Usage-based billing</button>
        `;
        document.querySelectorAll('.hitl-btn-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                chosenPricingModel = e.target.dataset.model;
                workflowStage = 5;
                versionLogs.push(`v1.4.0: Setup billing architecture: "${chosenPricingModel}"`);
                updateVersionHistory();
                triggerHITLApproval();
            });
        });

    } else if (workflowStage === 5) {
        hitlContent.innerHTML = `
            <div class="hitl-prompt"><strong>DevOps Architect</strong>: Database tables, Dockerfiles, and actions pipelines generated. Approve codebase configurations?</div>
            <button class="btn btn-primary btn-sm" id="hitl-approve-btn">Approve & Open Deployment</button>
        `;
        document.getElementById('hitl-approve-btn').addEventListener('click', () => {
            workflowStage = 6;
            versionLogs.push(`v1.5.0: Finalized code scripts and build tools.`);
            updateVersionHistory();
            triggerHITLApproval();
        });

    } else if (workflowStage === 6) {
        hitlContent.innerHTML = `
            <div class="hitl-prompt"><i class="fa-solid fa-circle-check text-emerald"></i> <strong>Orchestrator</strong>: Startup operating workflow completed successfully! The MVP is validated and deploy-ready.</div>
        `;
    }
}

function updateWorkflowActiveStep() {
    const steps = ['validation', 'market', 'branding', 'pricing', 'devops', 'launch'];
    steps.forEach((step, idx) => {
        const el = document.getElementById(`step-${step}`);
        el.className = 'workflow-step';
        if (idx + 1 < workflowStage) {
            el.classList.add('completed');
        } else if (idx + 1 === workflowStage) {
            el.classList.add('active');
        }
    });
}

function updateVersionHistory() {
    const timeline = document.getElementById('version-timeline');
    timeline.innerHTML = '';
    [...versionLogs].reverse().forEach((log, idx) => {
        const item = document.createElement('div');
        item.className = `timeline-item ${idx === 0 ? 'active' : ''}`;
        item.innerHTML = `
            <div class="timeline-dot"></div>
            <div class="timeline-title">${log.split(':')[0]}</div>
            <div class="timeline-desc">${log.split(':').slice(1).join(':').trim()}</div>
        `;
        timeline.appendChild(item);
    });
}

function renderDashboard(data) {
    const dashboardWrapper = document.getElementById('dashboard-wrapper');
    dashboardWrapper.classList.remove('hidden');

    // Reset deployment panel
    document.getElementById('deploy-console').classList.add('hidden');
    document.getElementById('deploy-logs').innerHTML = '';

    // ================== TAB 1: Health & Readiness ==================
    const val = data.investor.readiness_score;
    document.getElementById('overall-health-val').textContent = `${val}%`;
    document.getElementById('score-idea').textContent = `${val}%`;
    document.getElementById('fill-idea').style.width = `${val}%`;

    document.getElementById('score-market').textContent = '75%';
    document.getElementById('fill-market').style.width = '75%';

    document.getElementById('score-finance').textContent = '80%';
    document.getElementById('fill-finance').style.width = '80%';

    document.getElementById('score-branding').textContent = '90%';
    document.getElementById('fill-branding').style.width = '90%';

    document.getElementById('score-code').textContent = '50%';
    document.getElementById('fill-code').style.width = '50%';

    // AI Critic Audit
    document.getElementById('critic-score').textContent = val;
    document.getElementById('critic-verdict').textContent = data.investor.investment_thesis;
    populateList('critic-weaknesses', data.investor.swot.weaknesses);
    populateList('critic-suggestions', data.investor.swot.opportunities);

    // Competitors
    const market = data.market_research;
    const competitorTable = document.getElementById('competitor-table-body');
    competitorTable.innerHTML = '';
    market.competitors.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${escapeHTML(c.name)}</strong></td>
            <td><span class="badge">${escapeHTML(c.strength)}</span></td>
            <td>${escapeHTML(c.weakness)}</td>
        `;
        competitorTable.appendChild(tr);
    });

    // Localized Market Sizing
    const tamText = formatCurrency(market.tam);
    const samText = formatCurrency(market.sam);
    const somText = formatCurrency(market.som);

    const marketStats = document.getElementById('market-stats-container');
    marketStats.innerHTML = `
        <div class="stat-item">
            <div class="stat-val text-purple">${tamText}</div>
            <div class="stat-lbl">TAM</div>
        </div>
        <div class="stat-item">
            <div class="stat-val text-blue">${samText}</div>
            <div class="stat-lbl">SAM</div>
        </div>
        <div class="stat-item">
            <div class="stat-val text-emerald">${somText}</div>
            <div class="stat-lbl">SOM</div>
        </div>
    `;

    const tamVal = parseFloat(market.tam.replace(/[^0-9.]/g, ''));
    const samVal = parseFloat(market.sam.replace(/[^0-9.]/g, ''));
    const somVal = parseFloat(market.som.replace(/[^0-9.]/g, ''));
    renderMarketChart(tamVal * activeCurrencyRate, samVal * activeCurrencyRate, somVal * activeCurrencyRate);

    // ================== TAB 2: Strategy & Canvas ==================
    // PM console
    const pmConsole = document.getElementById('pm-milestones');
    pmConsole.innerHTML = `
        <div class="milestone-item">
            <div class="milestone-info">
                <i class="fa-solid fa-circle-check check"></i>
                <span>Business validation audit generated</span>
            </div>
            <span class="milestone-time">Done</span>
        </div>
        <div class="milestone-item">
            <div class="milestone-info">
                <i class="fa-solid fa-circle-check check"></i>
                <span>Competitor landscape mapped</span>
            </div>
            <span class="milestone-time">Done</span>
        </div>
        <div class="milestone-item">
            <div class="milestone-info">
                <i class="${workflowStage >= 3 ? 'fa-solid fa-circle-check check' : 'fa-solid fa-spinner fa-spin running'}"></i>
                <span>Branding assets and name selected</span>
            </div>
            <span class="milestone-time">${workflowStage >= 3 ? 'Done' : 'In Progress'}</span>
        </div>
        <div class="milestone-item">
            <div class="milestone-info">
                <i class="${workflowStage >= 5 ? 'fa-solid fa-circle-check check' : (workflowStage === 4 ? 'fa-solid fa-spinner fa-spin running' : 'fa-solid fa-clock pending')}"></i>
                <span>Financial pricing model set</span>
            </div>
            <span class="milestone-time">${workflowStage >= 5 ? 'Done' : (workflowStage === 4 ? 'In Progress' : 'Pending')}</span>
        </div>
        <div class="milestone-item">
            <div class="milestone-info">
                <i class="${workflowStage >= 6 ? 'fa-solid fa-circle-check check' : (workflowStage === 5 ? 'fa-solid fa-spinner fa-spin running' : 'fa-solid fa-clock pending')}"></i>
                <span>DevOps Docker config scripts written</span>
            </div>
            <span class="milestone-time">${workflowStage >= 6 ? 'Done' : (workflowStage === 5 ? 'In Progress' : 'Pending')}</span>
        </div>
    `;

    // Personas
    const personasContainer = document.getElementById('personas-container');
    personasContainer.innerHTML = '';
    data.customer_personas.forEach(p => {
        const pCard = document.createElement('div');
        pCard.className = 'persona-card';
        pCard.innerHTML = `
            <div class="persona-meta">
                <span class="persona-name">${escapeHTML(p.name)}</span>
                <span class="persona-age-role">${p.age} yrs • ${escapeHTML(p.role)}</span>
            </div>
            <div class="persona-detail">
                <p><strong>Profession:</strong> ${escapeHTML(p.profession)}</p>
                <p><strong>Pain Points:</strong> ${escapeHTML(p.pain_points)}</p>
                <p><strong>Buying Behavior:</strong> ${escapeHTML(p.buying_behavior)}</p>
                <p><strong>Interests:</strong> ${p.interests.map(i => `<span class="badge">${escapeHTML(i)}</span>`).join(' ')}</p>
            </div>
        `;
        personasContainer.appendChild(pCard);
    });

    // AI Debate Chamber logs
    const debateContainer = document.getElementById('debate-messages');
    debateContainer.innerHTML = `
        <div class="debate-msg pro">
            <span class="debate-speaker pro">Agent A (Business Analyst)</span>
            "The proposed startup idea matches strong early trends. Since deployment and setup pipelines are automated, the time-to-market is drastically reduced, allowing fast monetization cycles."
        </div>
        <div class="debate-msg con">
            <span class="debate-speaker con">Agent B (Critic Agent)</span>
            "However, target customers face low switching costs. The initial risk is saturation. If marketing conversion stays low, the monthly burn rate will exhaust early capital before PMF."
        </div>
        <div class="debate-msg judge">
            <span class="debate-speaker judge">Final Judge Verdict</span>
            "Debate concluded. Recommended path: proceed with MVP deployment, prioritize user acquisition benchmarks via SEO keywords, and lock pricing configurations under subscription models."
        </div>
    `;

    // Lean Canvas
    const bp = data.business_plan;
    document.getElementById('canvas-problem').textContent = bp.lean_canvas.problem;
    document.getElementById('canvas-solution').textContent = bp.lean_canvas.solution;
    document.getElementById('canvas-value-prop').textContent = bp.lean_canvas.value_proposition;
    document.getElementById('canvas-metrics').textContent = bp.lean_canvas.metrics;

    updateVersionHistory();

    // ================== TAB 3: Code & DevOps ==================
    document.getElementById('code-content-box').textContent = data.builder_console.db_schema;

    // ================== TAB 4: Marketing & Pitch ==================
    const branding = data.branding;
    const primaryCol = branding.colors.primary;
    const secondaryCol = branding.colors.secondary;

    // Logo SVG Preview
    const logoContainer = document.getElementById('logo-preview');
    logoContainer.innerHTML = `
        <svg viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="10" transform="translate(10, 10)" fill="url(#grad)" />
            <path d="M22 20L38 30L22 40V20Z" fill="white" />
            <text x="65" y="36" fill="white" font-family="'Outfit', sans-serif" font-weight="800" font-size="20">${data.name}</text>
            <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                    <stop stop-color="${primaryCol}" />
                    <stop offset="1" stop-color="${secondaryCol}" />
                </linearGradient>
            </defs>
        </svg>
    `;

    // Swatches
    const colorsContainer = document.getElementById('brand-colors-container');
    colorsContainer.innerHTML = `<h4>Brand Palette:</h4>`;
    Object.entries(branding.colors).forEach(([name, hex]) => {
        const item = document.createElement('div');
        item.className = 'swatch-item';
        item.innerHTML = `
            <div class="swatch-color" style="background-color: ${hex}"></div>
            <span>${name.toUpperCase()} (${hex})</span>
        `;
        colorsContainer.appendChild(item);
    });

    populateList('brand-taglines', branding.taglines);

    // Domains
    const domainList = document.getElementById('domain-list');
    domainList.innerHTML = '';
    branding.domains.forEach(d => {
        const li = document.createElement('li');
        const isAvail = d.status.toLowerCase() === 'available';
        li.innerHTML = `
            <span class="domain-name">${escapeHTML(d.domain)}</span>
            <span class="domain-status ${isAvail ? 'available' : 'taken'}">${escapeHTML(d.status)}</span>
        `;
        domainList.appendChild(li);
    });

    // Trademark
    const trademark = data.trademark;
    const trademarkContainer = document.getElementById('trademark-result');
    const isSafe = trademark.status.toLowerCase().includes('safe');
    trademarkContainer.innerHTML = `
        <div>
            <span class="trademark-status ${isSafe ? 'safe' : 'conflict'}">${trademark.status}</span>
            <p class="trademark-desc">${trademark.description}</p>
        </div>
    `;

    // Localized Slider label pricing
    const currentPriceSetting = parseFloat(priceSlider.value);
    document.getElementById('val-price').textContent = formatCurrency(currentPriceSetting);

    updateFinancialCharts();

    // Setup Video Canvas
    setupVideoPromoCanvas(primaryCol, secondaryCol, data.name);

    // Setup Pitch Slides
    currentSlideIndex = 0;
    updatePitchSlide();

    // ================== TAB 5: AI Mentor Chat ==================
    const chatLogs = document.getElementById('mentor-chat-logs');
    chatLogs.innerHTML = `
        <div class="chat-bubble mentor">
            Hi! I am your coordinates AI Mentor for <strong>${data.name}</strong>. Feel free to ask me questions like:
            <br><em>"Should I increase my pricing?"</em> or <em>"How can I beat my competitors?"</em>
        </div>
    `;
}

// Financial calculations with live sliders & dynamic currency multipliers
const conversionSlider = document.getElementById('slider-conversion');
const priceSlider = document.getElementById('slider-price');

conversionSlider.addEventListener('input', (e) => {
    document.getElementById('val-conversion').textContent = e.target.value;
    updateFinancialCharts();
});

priceSlider.addEventListener('input', (e) => {
    const usdVal = parseFloat(e.target.value);
    document.getElementById('val-price').textContent = formatCurrency(usdVal);
    updateFinancialCharts();
});

function updateFinancialCharts() {
    if (!projectResults) return;

    const goalConversions = parseInt(conversionSlider.value);
    const subscriptionPriceUSD = parseFloat(priceSlider.value);

    // Convert values to localized rates
    const localBasePrice = subscriptionPriceUSD * activeCurrencyRate;
    const year1RevLocal = goalConversions * localBasePrice * 12;
    const year2RevLocal = parseInt(year1RevLocal * 2.2);
    const year3RevLocal = parseInt(year2RevLocal * 1.8);

    const pricingContainer = document.getElementById('pricing-tiers-container');
    pricingContainer.innerHTML = `
        <div class="price-card">
            <div class="price-tier">Starter</div>
            <div class="price-value">${activeCurrencySymbol}${parseInt(localBasePrice * 0.4)}/mo</div>
            <div class="price-features">Basic workspace configuration</div>
        </div>
        <div class="price-card pro">
            <div class="price-tier">Pro Target</div>
            <div class="price-value">${activeCurrencySymbol}${parseInt(localBasePrice)}/mo</div>
            <div class="price-features">Advanced tools and analytics metrics</div>
        </div>
        <div class="price-card">
            <div class="price-tier">Enterprise</div>
            <div class="price-value">${activeCurrencySymbol}${parseInt(localBasePrice * 3)}/mo</div>
            <div class="price-features">Custom integrations and SLAs</div>
        </div>
    `;

    renderRevenueChart([year1RevLocal / 1000, year2RevLocal / 1000, year3RevLocal / 1000]);
}

// Pitch slideshow functionality
function updatePitchSlide() {
    if (!projectResults) return;
    const slide = projectResults.pitch_deck[currentSlideIndex];
    document.getElementById('slide-title').textContent = slide.title;

    let slideText = slide.text;
    if (slideText.includes('$')) {
        const match = slideText.match(/\$([0-9,]+)M?/);
        if (match) {
            const rawVal = parseFloat(match[1].replace(/,/g, ''));
            const isMil = slideText.includes('M');
            const convertedFormatted = formatCurrency(isMil ? rawVal * 1000000 : rawVal);
            slideText = slideText.replace(match[0], isMil ? convertedFormatted : convertedFormatted);
        }
    }
    document.getElementById('slide-text').textContent = slideText;
    document.getElementById('slide-number').textContent = `${currentSlideIndex + 1} / 5`;
}

document.getElementById('prev-slide').addEventListener('click', () => {
    if (currentSlideIndex > 0) {
        currentSlideIndex--;
        updatePitchSlide();
    }
});

document.getElementById('next-slide').addEventListener('click', () => {
    if (currentSlideIndex < 4) {
        currentSlideIndex--;
        currentSlideIndex = Math.min(currentSlideIndex + 2, 4);
        updatePitchSlide();
    }
});

// Code File Switcher
document.querySelectorAll('.code-select').forEach(button => {
    button.addEventListener('click', (e) => {
        document.querySelectorAll('.code-select').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        const type = e.target.dataset.code;
        const codeBox = document.getElementById('code-content-box');

        if (type === 'code-db') {
            codeBox.textContent = projectResults.builder_console.db_schema;
        } else if (type === 'code-docker') {
            codeBox.textContent = projectResults.builder_console.dockerfile;
        } else if (type === 'code-action') {
            codeBox.textContent = projectResults.builder_console.github_action;
        }
    });
});

// Navigation tab clicks
document.querySelectorAll('.nav-tab').forEach(button => {
    button.addEventListener('click', (e) => {
        const clickedTab = e.currentTarget;
        document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
        clickedTab.classList.add('active');

        const targetPaneId = clickedTab.dataset.tab;
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        document.getElementById(targetPaneId).classList.add('active');
    });
});

// Interactive Promotional Video Canvas player
function setupVideoPromoCanvas(primaryCol, secondaryCol, brandName) {
    const canvas = document.getElementById('promoVideoCanvas');
    const ctx = canvas.getContext('2d');
    const playBtn = document.getElementById('video-play-btn');

    playBtn.classList.remove('playing');
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    ctx.font = "bold 24px 'Outfit', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(`${brandName} Promo Concept`, canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = "14px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('Click to play AI video visualization draft', canvas.width / 2, canvas.height / 2 + 25);

    playBtn.onclick = () => {
        playBtn.classList.add('playing');
        animateVideo(ctx, canvas, primaryCol, secondaryCol, brandName);
    };
}

function animateVideo(ctx, canvas, color1, color2, name) {
    let frame = 0;
    const maxFrames = 250;

    function draw() {
        if (frame >= maxFrames) {
            setupVideoPromoCanvas(color1, color2, name);
            return;
        }

        ctx.fillStyle = '#050811';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(255,255,255,0.02)';
        ctx.lineWidth = 1;
        for (let i = 0; i < canvas.width; i += 30) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvas.height);
            ctx.stroke();
        }
        for (let j = 0; j < canvas.height; j += 30) {
            ctx.beginPath();
            ctx.moveTo(0, j + (frame % 30));
            ctx.lineTo(canvas.width, j + (frame % 30));
            ctx.stroke();
        }

        const scale = 1 + Math.sin(frame * 0.05) * 0.15;
        const radGrd = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, 120 * scale
        );
        radGrd.addColorStop(0, color1 + '33');
        radGrd.addColorStop(0.5, color2 + '11');
        radGrd.addColorStop(1, 'transparent');
        ctx.fillStyle = radGrd;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 140 * scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(frame * 0.02);
        ctx.strokeStyle = color1;
        ctx.lineWidth = 3;
        ctx.strokeRect(-50, -50, 100, 100);
        ctx.strokeStyle = color2;
        ctx.strokeRect(-30, -30, 60, 60);
        ctx.restore();

        ctx.fillStyle = '#ffffff';
        ctx.font = "bold 32px 'Outfit', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText(name, canvas.width / 2, canvas.height / 2 + 10);
        ctx.font = "14px 'Plus Jakarta Sans', sans-serif";
        ctx.fillStyle = color2;
        ctx.fillText('Scale Fast. Build Instantly.', canvas.width / 2, canvas.height / 2 + 120);

        frame++;
        animationId = requestAnimationFrame(draw);
    }

    draw();
}

// Action Center Deployment Trigger
document.getElementById('github-btn').addEventListener('click', () => triggerDeployFlow('GitHub'));
document.getElementById('deploy-btn').addEventListener('click', () => triggerDeployFlow('Vercel'));

function triggerDeployFlow(platform) {
    if (!currentTaskId) return;

    const consoleDiv = document.getElementById('deploy-console');
    const logsDiv = document.getElementById('deploy-logs');

    consoleDiv.classList.remove('hidden');
    logsDiv.innerHTML = '';

    const ws = new WebSocket(`${WS_BASE}/ws/deploy/${currentTaskId}`);

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.log) {
            const entry = document.createElement('div');
            entry.className = 'deploy-log-entry';
            entry.innerHTML = `<span style="color: #06b6d4">&gt;</span> ${escapeHTML(data.log)}`;
            logsDiv.appendChild(entry);
            logsDiv.scrollTop = logsDiv.scrollHeight;
        } else if (data.status === 'deployed') {
            const entry = document.createElement('div');
            entry.className = 'deploy-log-entry';
            entry.innerHTML = `<span style="color: #10b981; font-weight: bold;">✔ Deployment completed successfully! Link:</span> <a href="${data.url}" target="_blank" style="color: #10b981; text-decoration: underline;">${data.url}</a>`;
            logsDiv.appendChild(entry);
            logsDiv.scrollTop = logsDiv.scrollHeight;
            ws.close();

            versionLogs.push(`v2.0.0: Successfully launched validated MVP to Vercel Cloud.`);
            updateVersionHistory();
        }
    };
}

// Mentor Chat Logic
document.getElementById('mentor-chat-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const chatInput = document.getElementById('mentor-chat-input');
    const message = chatInput.value.trim();
    if (!message || !currentTaskId) return;

    appendChatBubble('user', message);
    chatInput.value = '';

    try {
        const response = await fetch(`${API_BASE}/api/v1/mentor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task_id: currentTaskId, message: message })
        });

        const data = await response.json();
        appendChatBubble('mentor', data.response);

    } catch (err) {
        console.error(err);
        appendChatBubble('mentor', 'Sorry, I lost connection to the server. Please check your backend.');
    }
});

function appendChatBubble(sender, text) {
    const chatLogs = document.getElementById('mentor-chat-logs');
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;
    bubble.innerHTML = text;
    chatLogs.appendChild(bubble);
    chatLogs.scrollTop = chatLogs.scrollHeight;
}

function populateList(elementId, items) {
    const el = document.getElementById(elementId);
    el.innerHTML = '';
    items.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        el.appendChild(li);
    });
}

function renderMarketChart(tam, sam, som) {
    if (marketChartInstance) {
        marketChartInstance.destroy();
    }

    const ctx = document.getElementById('marketChart').getContext('2d');
    marketChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Total Addressable Market', 'Serviceable Addressable Market', 'Serviceable Obtainable Market'],
            datasets: [{
                data: [tam, sam, som],
                backgroundColor: [
                    'rgba(167, 139, 250, 0.65)',
                    'rgba(6, 182, 212, 0.65)',
                    'rgba(16, 185, 129, 0.65)'
                ],
                borderColor: [
                    '#a78bfa',
                    '#06b6d4',
                    '#10b981'
                ],
                borderWidth: 1.5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            cutout: '70%'
        }
    });
}

function renderRevenueChart(revenueData) {
    if (revenueChartInstance) {
        revenueChartInstance.destroy();
    }

    const ctx = document.getElementById('revenueChart').getContext('2d');
    revenueChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Year 1', 'Year 2', 'Year 3'],
            datasets: [{
                label: `Revenue Projection (in Thousands of ${activeCurrencySymbol})`,
                data: revenueData,
                backgroundColor: 'rgba(251, 191, 36, 0.65)',
                borderColor: '#fbbf24',
                borderWidth: 1.5,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#9ca3af',
                        callback: function (val) {
                            return activeCurrencySymbol + val + 'k';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#9ca3af'
                    }
                }
            }
        }
    });
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// ==================== NEW MODULE: WEB & MEDIA GENERATORS ====================
let cinematicAnimationId = null;

// React/Next.js Code & Preview Generator
document.getElementById('gen-web-code-btn').addEventListener('click', () => {
    const spin = document.getElementById('web-spin-icon');
    spin.classList.remove('hidden');

    setTimeout(() => {
        spin.classList.add('hidden');
        if (!projectResults) return;

        const primaryCol = projectResults.branding.colors.primary;
        const secondaryCol = projectResults.branding.colors.secondary;
        const brandName = projectResults.name;
        const tagline = projectResults.branding.taglines[0] || "Revolutionizing Startup Scaling";
        const problem = projectResults.business_plan.lean_canvas.problem;
        const solution = projectResults.business_plan.lean_canvas.solution;

        // Generate Next.js React Code String
        const reactCode = `import Head from 'next/head';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 font-sans selection:bg-[${primaryCol}] selection:text-black">
      <Head>
        <title>${brandName} - ${tagline}</title>
        <meta name="description" content="${solution.substring(0, 150)}..." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="${brandName} | Startup OS" />
        <meta property="og:description" content="${solution.substring(0, 150)}" />
        <meta property="og:image" content="/assets/hero-cover.jpg" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-gray-800 bg-[#0b0f19]/80 py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[${primaryCol}] to-[${secondaryCol}] flex items-center justify-center font-bold text-white">
            ${brandName.charAt(0)}
          </div>
          <span className="text-xl font-bold tracking-tight text-white">${brandName}</span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-400">
          <a href="#features" className="hover:text-[${primaryCol}] transition">Features</a>
          <a href="#solution" className="hover:text-[${primaryCol}] transition">Solution</a>
          <a href="#pricing" className="hover:text-[${primaryCol}] transition">Pricing</a>
        </nav>
        <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[${primaryCol}] to-[${secondaryCol}] text-black font-semibold text-sm hover:opacity-90 transition">
          Launch App
        </button>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-[${primaryCol}]/10 blur-[120px] pointer-events-none" />
        <span className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider text-[${primaryCol}] bg-[${primaryCol}]/10 uppercase mb-6">
          Validated & Ready
        </span>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-tight">
          ${tagline}
        </h1>
        <p className="mt-6 text-lg text-gray-400 max-w-2xl leading-relaxed">
          ${solution}
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-[${primaryCol}] to-[${secondaryCol}] text-black font-bold hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all">
            Get Started Free
          </button>
          <button className="px-8 py-4 rounded-xl bg-gray-800 border border-gray-700 text-white font-medium hover:bg-gray-750 transition">
            Book Demo
          </button>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section id="features" className="py-20 border-t border-gray-800/60 px-6 md:px-12 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-white">Why Choose ${brandName}?</h2>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-gray-900/40 border border-gray-800/80 hover:border-[${primaryCol}]/30 transition-all">
            <h3 className="text-xl font-semibold text-white">Market Calibrated</h3>
            <p className="mt-4 text-gray-400 leading-relaxed">${problem}</p>
          </div>
          <div className="p-8 rounded-2xl bg-gray-900/40 border border-gray-800/80 hover:border-[${primaryCol}]/30 transition-all">
            <h3 className="text-xl font-semibold text-white">Next-Gen Speed</h3>
            <p className="mt-4 text-gray-400 leading-relaxed">Our AI automated engine configures and provisions code architectures instantly.</p>
          </div>
          <div className="p-8 rounded-2xl bg-gray-900/40 border border-gray-800/80 hover:border-[${primaryCol}]/30 transition-all">
            <h3 className="text-xl font-semibold text-white">Verified Security</h3>
            <p className="mt-4 text-gray-400 leading-relaxed">Secure GitHub integrations and containerized environments built-in by design.</p>
          </div>
        </div>
      </section>
    </div>
  );
}`;

        document.getElementById('web-code-content-box').textContent = reactCode;

        // Generate Sandbox Preview IFrame srcdoc Content
        const htmlDoc = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>${brandName}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;850&display=swap" rel="stylesheet">
            <style>
              body { font-family: 'Outfit', sans-serif; background-color: #0b0f19; color: #f3f4f6; }
            </style>
          </head>
          <body class="p-6 md:p-12">
            <header class="flex justify-between items-center py-4 border-b border-gray-800">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded bg-gradient-to-tr from-[${primaryCol}] to-[${secondaryCol}] flex items-center justify-center font-bold text-black">${brandName.charAt(0)}</div>
                <span class="text-xl font-bold text-white">${brandName}</span>
              </div>
              <button class="px-4 py-1.5 rounded text-sm font-semibold text-black bg-gradient-to-r from-[${primaryCol}] to-[${secondaryCol}] hover:opacity-90 transition">Launch</button>
            </header>
            
            <section class="text-center py-16 max-w-3xl mx-auto">
              <span class="px-3 py-1 rounded-full text-xs font-semibold text-[${primaryCol}] bg-[${primaryCol}]/10 uppercase">Live Preview Sandbox</span>
              <h1 class="text-3xl md:text-5xl font-extrabold mt-6 tracking-tight text-white leading-tight">${tagline}</h1>
              <p class="text-gray-400 mt-6 leading-relaxed">${solution}</p>
              <div class="mt-8 flex justify-center gap-4">
                <button class="px-6 py-3 rounded font-bold text-black bg-gradient-to-r from-[${primaryCol}] to-[${secondaryCol}] hover:shadow-[0_0_20px_${primaryCol}55]">Get Started Free</button>
                <button class="px-6 py-3 rounded border border-gray-700 hover:bg-gray-800">Learn More</button>
              </div>
            </section>

            <section class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-12 border-t border-gray-800">
              <div class="p-6 rounded bg-gray-900/60 border border-gray-800">
                <h3 class="font-bold text-white text-lg">Target Focus</h3>
                <p class="text-sm text-gray-400 mt-2">${problem}</p>
              </div>
              <div class="p-6 rounded bg-gray-900/60 border border-gray-800">
                <h3 class="font-bold text-white text-lg">Integrated Assets</h3>
                <p class="text-sm text-gray-400 mt-2">Equipped with custom brand parameters (${primaryCol} & ${secondaryCol}) and high-performance React routing.</p>
              </div>
            </section>
          </body>
          </html>
        `;

        document.getElementById('sandbox-iframe').srcdoc = htmlDoc;
    }, 1500);
});

// AI Cinematic Ads Generator script animations
document.getElementById('cinematic-play-btn').addEventListener('click', () => {
    const canvas = document.getElementById('cinematicVideoCanvas');
    const ctx = canvas.getContext('2d');

    if (cinematicAnimationId) {
        cancelAnimationFrame(cinematicAnimationId);
    }

    if (!projectResults) return;

    const primaryCol = projectResults.branding.colors.primary;
    const secondaryCol = projectResults.branding.colors.secondary;
    const brandName = projectResults.name;
    const tagline = projectResults.branding.taglines[0] || "Revolutionizing Startup Scaling";

    let frame = 0;
    const maxFrames = 480;

    function drawCinematic() {
        if (frame >= maxFrames) {
            ctx.fillStyle = '#050811';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ffffff';
            ctx.font = "bold 20px 'Outfit', sans-serif";
            ctx.textAlign = 'center';
            ctx.fillText("Cinematic Ad Demo Finished.", canvas.width / 2, canvas.height / 2);
            return;
        }

        ctx.fillStyle = '#03050a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Panning grids background
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
        ctx.lineWidth = 1;
        const offset = (frame * 1.5) % 40;
        for (let x = -40; x < canvas.width + 40; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x + offset, 0);
            ctx.lineTo(x + offset - 30, canvas.height);
            ctx.stroke();
        }

        // Scene timelines
        if (frame < 120) {
            // Scene 1: Introduction text
            ctx.fillStyle = 'rgba(255,255,255,' + Math.min(1, frame / 30, (120 - frame) / 30) + ')';
            ctx.font = "italic 18px 'Plus Jakarta Sans', sans-serif";
            ctx.textAlign = 'center';
            ctx.fillText("In a saturated market...", canvas.width / 2, canvas.height / 2 - 10);
            ctx.fillText("Speed and precision are everything.", canvas.width / 2, canvas.height / 2 + 15);
        } else if (frame >= 120 && frame < 260) {
            // Scene 2: The reveal with glowing neon orb
            const orbScale = 1 + Math.sin(frame * 0.08) * 0.1;
            const grad = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, 0,
                canvas.width / 2, canvas.height / 2, 100 * orbScale
            );
            grad.addColorStop(0, primaryCol + '33');
            grad.addColorStop(0.6, secondaryCol + '11');
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, 120 * orbScale, 0, Math.PI * 2);
            ctx.fill();

            // Rotating neon frame
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(frame * 0.01);
            ctx.strokeStyle = primaryCol;
            ctx.lineWidth = 2;
            ctx.strokeRect(-60, -60, 120, 120);
            ctx.restore();

            ctx.fillStyle = 'rgba(255,255,255,' + Math.min(1, (frame - 120) / 30, (260 - frame) / 30) + ')';
            ctx.font = "bold 26px 'Outfit', sans-serif";
            ctx.textAlign = 'center';
            ctx.fillText("Introducing " + brandName, canvas.width / 2, canvas.height / 2 + 10);
        } else if (frame >= 260 && frame < 400) {
            // Scene 3: Tagline call-to-action
            const slideOffset = (frame - 260) * 0.2;
            ctx.fillStyle = 'rgba(255,255,255,' + Math.min(1, (frame - 260) / 30, (400 - frame) / 30) + ')';
            ctx.font = "bold 20px 'Outfit', sans-serif";
            ctx.textAlign = 'center';
            ctx.fillText(tagline, canvas.width / 2, canvas.height / 2 - 20 + slideOffset);

            ctx.font = "14px 'Plus Jakarta Sans', sans-serif";
            ctx.fillStyle = primaryCol;
            ctx.fillText("Calibrated by Coordinated Agent Networks.", canvas.width / 2, canvas.height / 2 + 25);
        } else {
            // Scene 4: Outro logo and link
            ctx.fillStyle = 'rgba(255,255,255,' + Math.min(1, (frame - 400) / 30) + ')';
            ctx.font = "bold 32px 'Outfit', sans-serif";
            ctx.textAlign = 'center';
            ctx.fillText(brandName, canvas.width / 2, canvas.height / 2 - 20);

            ctx.font = "14px 'Plus Jakarta Sans', sans-serif";
            ctx.fillStyle = '#9ca3af';
            ctx.fillText("Generated on StartupForge OS.", canvas.width / 2, canvas.height / 2 + 20);
        }

        frame++;
        cinematicAnimationId = requestAnimationFrame(drawCinematic);
    }

    drawCinematic();
});
