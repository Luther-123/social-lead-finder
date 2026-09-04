// Dynamic API URL lookup supporting the Settings page configuration
function getApiUrl() {
    return localStorage.getItem("sld_api_url") || "https://social-lead-finder-production.up.railway.app";
}

// Derive WebSocket URL from the active backend API host instead of the frontend host
function getWsUrl() {
    const apiUrl = getApiUrl();
    const wsProtocol = apiUrl.startsWith("https") ? "wss:" : "ws:";
    const cleanHost = apiUrl.replace(/^https?:\/\//, "");
    return `${wsProtocol}//${cleanHost}/ws/leads`;
}

let socket;

function initWebSocket() {
    socket = new WebSocket(getWsUrl());

    socket.onopen = () => {
        console.log("Real-time lead feed connected.");
    };

    socket.onmessage = (event) => {
        const lead = JSON.parse(event.data);
        appendLeadToDashboardTable(lead);
    };

    socket.onclose = () => {
        console.warn("Lead feed disconnected. Reconnecting in 5s...");
        setTimeout(initWebSocket, 5000);
    };
}

document.addEventListener("DOMContentLoaded", () => {
    loadSettings();
    fetchKeywords();
    fetchLeads();
    initWebSocket();

    const addKeywordBtn = document.getElementById("addKeywordBtn");
    if (addKeywordBtn) addKeywordBtn.addEventListener("click", addKeyword);

    const addLeadBtn = document.getElementById("addLeadBtn");
    if (addLeadBtn) addLeadBtn.addEventListener("click", simulateLead);

    const saveSettingsBtn = document.getElementById("saveSettingsBtn");
    if (saveSettingsBtn) saveSettingsBtn.addEventListener("click", saveSettings);
});

async function fetchKeywords() {
    try {
        const response = await fetch(`${getApiUrl()}/keywords/`);
        const keywords = await response.json();

        const list = document.getElementById("keywordList");
        if (!list) return;
        list.innerHTML = "";

        if (keywords.length === 0) {
            list.innerHTML = `<li style="color: #a0aec0; justify-content: center;">No keywords tracked yet.</li>`;
            return;
        }

        keywords.forEach(kw => {
            const li = document.createElement("li");
            li.innerHTML = `
                <span>${kw.term} <small style="color: #a0aec0;">(ID: ${kw.id})</small></span>
                <button onclick="deleteKeyword(${kw.id})" style="background: #e53e3e; color: white; padding: 4px 8px; font-size: 0.8rem; border-radius: 4px; border: none; cursor: pointer;">Delete</button>
            `;
            list.appendChild(li);
        });
    } catch (err) {
        console.error("Error fetching keywords:", err);
    }
}

async function deleteKeyword(id) {
    try {
        const response = await fetch(`${getApiUrl()}/keywords/${id}`, { method: "DELETE" });
        if (response.ok) {
            fetchKeywords();
            const viewKeywords = document.getElementById("view-keywords");
            if (viewKeywords && viewKeywords.style.display === "block") {
                loadFullKeywordsTable();
            }
        }
    } catch (err) {
        console.error("Error deleting keyword:", err);
    }
}

async function fetchLeads() {
    try {
        const response = await fetch(`${getApiUrl()}/leads/`);
        const leads = await response.json();

        const container = document.getElementById("leadFeedContainer");
        if (!container) return;

        container.innerHTML = "";

        if (leads.length === 0) {
            container.innerHTML = `<p style="color: #a0aec0; text-align: center; margin-top: 40px;">No leads captured yet. Use the simulator on the left or wait for live signals.</p>`;
            return;
        }

        leads.forEach(lead => {
            const div = document.createElement("div");
            div.className = "lead-item";
            div.style.cssText = "background: #f7fafc; border: 1px solid #e2e8f0; padding: 12px; margin-bottom: 10px; border-radius: 6px; border-left: 3px solid #3182ce;";
            div.innerHTML = `
                <p style="margin: 0; color: #2d3748;">${lead.content}</p>
                <div style="margin-top: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <small style="color: #718096;">Keyword ID: ${lead.keyword_id}</small>
                    <div>
                        <a href="${lead.source_url}" target="_blank" style="font-size: 0.8rem; color: #3182ce; margin-right: 10px; text-decoration: none;">View Source</a>
                        <button onclick="deleteLead(${lead.id})" style="background: #e53e3e; color: white; border: none; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; cursor: pointer;">Delete</button>
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
    } catch (err) {
        console.error("Error fetching leads:", err);
    }
}

async function deleteLead(id) {
    try {
        const response = await fetch(`${getApiUrl()}/leads/${id}`, { method: "DELETE" });
        if (response.ok) {
            fetchLeads();
            const viewLeads = document.getElementById("view-leads");
            if (viewLeads && viewLeads.style.display === "block") {
                loadFullLeadsTable();
            }
        }
    } catch (err) {
        console.error("Error deleting lead:", err);
    }
}

async function addKeyword() {
    const input = document.getElementById("keywordInput");
    if (!input) return;
    const term = input.value.trim();
    if (!term) return;

    try {
        const response = await fetch(`${getApiUrl()}/keywords/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ term })
        });

        if (response.ok) {
            input.value = "";
            fetchKeywords();
        }
    } catch (err) {
        console.error("Error adding keyword:", err);
    }
}

async function simulateLead() {
    const kwInput = document.getElementById("leadKeywordId");
    const contentInput = document.getElementById("leadContent");
    const urlInput = document.getElementById("leadUrl");

    if (!kwInput || !contentInput || !urlInput) return;

    const keyword_id = parseInt(kwInput.value);
    const content = contentInput.value.trim();
    const source_url = urlInput.value.trim();

    if (!keyword_id || !content || !source_url) return;

    try {
        const response = await fetch(`${getApiUrl()}/leads/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ keyword_id, content, source_url })
        });

        if (response.ok) {
            kwInput.value = "";
            contentInput.value = "";
            urlInput.value = "";
            fetchLeads();
        }
    } catch (err) {
        console.error("Error simulating lead:", err);
    }
}

function switchView(viewName) {
    document.querySelectorAll(".nav-links li").forEach(li => li.classList.remove("active"));
    const navEl = document.getElementById(`nav-${viewName}`);
    if (navEl) navEl.classList.add("active");

    document.querySelectorAll(".view-section").forEach(sec => sec.style.display = "none");

    const targetView = document.getElementById(`view-${viewName}`);
    const titleEl = document.getElementById("pageTitle");

    if (targetView) targetView.style.display = viewName === 'dashboard' ? "grid" : "block";

    if (titleEl) {
        if (viewName === 'dashboard') titleEl.textContent = "Live Monitoring Dashboard";
        else if (viewName === 'keywords') titleEl.textContent = "Tracked Keywords Management";
        else if (viewName === 'leads') titleEl.textContent = "Captured Leads Archive";
        else if (viewName === 'settings') titleEl.textContent = "System Settings";
    }

    if (viewName === 'dashboard') {
        fetchKeywords();
        fetchLeads();
    } else if (viewName === 'keywords') {
        loadFullKeywordsTable();
    } else if (viewName === 'leads') {
        loadFullLeadsTable();
    }
}

async function loadFullKeywordsTable() {
    const container = document.getElementById("fullKeywordTableContainer");
    if (!container) return;
    try {
        const res = await fetch(`${getApiUrl()}/keywords/`);
        const keywords = await res.json();

        container.innerHTML = `
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                    <tr style="border-bottom: 2px solid #cbd5e0; background: #f7fafc;">
                        <th style="padding: 10px;">ID</th>
                        <th style="padding: 10px;">Keyword Term</th>
                        <th style="padding: 10px;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${keywords.map(kw => `
                        <tr style="border-bottom: 1px solid #edf2f7;">
                            <td style="padding: 10px;">${kw.id}</td>
                            <td style="padding: 10px; font-weight: 600;">${kw.term}</td>
                            <td style="padding: 10px;"><button onclick="deleteKeyword(${kw.id}); loadFullKeywordsTable();" style="background: #e53e3e; color: white; padding: 4px 8px; font-size: 0.8rem; border-radius: 4px; border: none; cursor: pointer;">Delete</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (err) {
        console.error("Error loading keywords table:", err);
    }
}

async function loadFullLeadsTable() {
    const container = document.getElementById("fullLeadTableContainer");
    if (!container) return;
    try {
        const res = await fetch(`${getApiUrl()}/leads/`);
        const leads = await res.json();

        container.innerHTML = `
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                    <tr style="border-bottom: 2px solid #cbd5e0; background: #f7fafc;">
                        <th style="padding: 10px;">ID</th>
                        <th style="padding: 10px;">Keyword ID</th>
                        <th style="padding: 10px;">Post Content</th>
                        <th style="padding: 10px;">Source</th>
                        <th style="padding: 10px;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${leads.map(l => `
                        <tr style="border-bottom: 1px solid #edf2f7;">
                            <td style="padding: 10px;">${l.id}</td>
                            <td style="padding: 10px;">${l.keyword_id}</td>
                            <td style="padding: 10px; max-width: 300px;">${l.content}</td>
                            <td style="padding: 10px;"><a href="${l.source_url}" target="_blank" style="color: #3182ce;">Link</a></td>
                            <td style="padding: 10px;"><button onclick="deleteLead(${l.id}); loadFullLeadsTable();" style="background: #e53e3e; color: white; padding: 4px 8px; font-size: 0.8rem; border-radius: 4px; border: none; cursor: pointer;">Delete</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (err) {
        console.error("Error loading leads table:", err);
    }
}

function saveSettings() {
    const apiInput = document.getElementById("settingApiUrl");
    const pollInput = document.getElementById("settingPollInterval");
    if (!apiInput || !pollInput) return;

    localStorage.setItem("sld_api_url", apiInput.value.trim());
    localStorage.setItem("sld_poll_interval", pollInput.value.trim());

    const statusMsg = document.getElementById("settingsStatus");
    if (statusMsg) {
        statusMsg.style.opacity = "1";
        setTimeout(() => {
            statusMsg.style.opacity = "0";
        }, 3000);
    }
}

function loadSettings() {
    const savedApiUrl = localStorage.getItem("sld_api_url");
    const savedPollInterval = localStorage.getItem("sld_poll_interval");

    const apiInput = document.getElementById("settingApiUrl");
    const pollInput = document.getElementById("settingPollInterval");

    if (savedApiUrl && apiInput) apiInput.value = savedApiUrl;
    if (savedPollInterval && pollInput) pollInput.value = savedPollInterval;
}

function appendLeadToDashboardTable(lead) {
    const container = document.getElementById("leadFeedContainer");
    if (!container) return;

    const p = container.querySelector("p");
    if (p && p.textContent.includes("No leads captured yet")) {
        container.innerHTML = "";
    }

    const div = document.createElement("div");
    div.className = "lead-item";
    div.style.cssText = "background: #f7fafc; border: 1px solid #e2e8f0; padding: 12px; margin-bottom: 10px; border-radius: 6px; border-left: 3px solid #3182ce;";
    div.innerHTML = `
        <p style="margin: 0; color: #2d3748;">${lead.content}</p>
        <div style="margin-top: 8px; display: flex; justify-content: space-between; align-items: center;">
            <small style="color: #718096;">Keyword ID: ${lead.keyword_id}</small>
            <div>
                <a href="${lead.source_url}" target="_blank" style="font-size: 0.8rem; color: #3182ce; margin-right: 10px; text-decoration: none;">View Source</a>
                <button onclick="deleteLead(${lead.id})" style="background: #e53e3e; color: white; border: none; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; cursor: pointer;">Delete</button>
            </div>
        </div>
    `;
    container.prepend(div);
}