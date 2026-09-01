const API_URL = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", () => {
    fetchKeywords();
    fetchLeads();

    document.getElementById("addKeywordBtn").addEventListener("click", addKeyword);
});

async function fetchKeywords() {
    try {
        const response = await fetch(`${API_URL}/keywords/`);
        const keywords = await response.json();

        const list = document.getElementById("keywordList");
        list.innerHTML = "";

        keywords.forEach(kw => {
            const li = document.createElement("li");
            li.innerHTML = `
                <span>${kw.term} <small style="color: #a0aec0;">(ID: ${kw.id})</small></span>
                <button onclick="deleteKeyword(${kw.id})" style="background: #e53e3e; padding: 4px 8px; font-size: 0.8rem;">Delete</button>
            `;
            list.appendChild(li);
        });
    } catch (err) {
        console.error("Error fetching keywords:", err);
    }
}

async function deleteKeyword(id) {
    try {
        const response = await fetch(`${API_URL}/keywords/${id}`, { method: "DELETE" });
        if (response.ok) fetchKeywords();
    } catch (err) {
        console.error("Error deleting keyword:", err);
    }
}

async function fetchLeads() {
    try {
        const response = await fetch(`${API_URL}/leads/`);
        const leads = await response.json();

        const container = document.getElementById("leadFeedContainer");
        if (leads.length > 0) {
            container.innerHTML = "";
            leads.forEach(lead => {
                const div = document.createElement("div");
                div.className = "lead-item";
                div.innerHTML = `
                    <p>${lead.content}</p>
                    <div style="margin-top: 8px; display: flex; justify-content: space-between; align-items: center;">
                        <small style="color: #718096;">Keyword ID: ${lead.keyword_id}</small>
                        <div>
                            <a href="${lead.source_url}" target="_blank" style="font-size: 0.8rem; color: #3182ce; margin-right: 10px;">View Source</a>
                            <button onclick="deleteLead(${lead.id})" style="background: #e53e3e; padding: 2px 6px; font-size: 0.75rem;">Delete</button>
                        </div>
                    </div>
                `;
                container.appendChild(div);
            });
        }
    } catch (err) {
        console.error("Error fetching leads:", err);
    }
}

async function deleteLead(id) {
    try {
        const response = await fetch(`${API_URL}/leads/${id}`, { method: "DELETE" });
        if (response.ok) fetchLeads();
    } catch (err) {
        console.error("Error deleting lead:", err);
    }
}

async function addKeyword() {
    const input = document.getElementById("keywordInput");
    const term = input.value.trim();
    if (!term) return;

    try {
        const response = await fetch(`${API_URL}/keywords/`, {
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

document.addEventListener("DOMContentLoaded", () => {
    fetchKeywords();
    fetchLeads();

    document.getElementById("addKeywordBtn").addEventListener("click", addKeyword);
    document.getElementById("addLeadBtn").addEventListener("click", simulateLead);
});

async function simulateLead() {
    const keyword_id = parseInt(document.getElementById("leadKeywordId").value);
    const content = document.getElementById("leadContent").value.trim();
    const source_url = document.getElementById("leadUrl").value.trim();

    if (!keyword_id || !content || !source_url) return;

    try {
        const response = await fetch(`${API_URL}/leads/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ keyword_id, content, source_url })
        });

        if (response.ok) {
            document.getElementById("leadContent").value = "";
            document.getElementById("leadUrl").value = "";
            fetchLeads();
        }
    } catch (err) {
        console.error("Error simulating lead:", err);
    }
}
function switchView(viewName) {
    document.querySelectorAll(".nav-links li").forEach(li => li.classList.remove("active"));
    document.getElementById(`nav-${viewName}`).classList.add("active");

    document.querySelectorAll(".view-section").forEach(sec => sec.style.display = "none");

    const targetView = document.getElementById(`view-${viewName}`);
    const titleEl = document.getElementById("pageTitle");

    if (viewName === 'dashboard') {
        targetView.style.display = "grid";
        titleEl.textContent = "Live Monitoring Dashboard";
        fetchKeywords();
        fetchLeads();
    } else if (viewName === 'keywords') {
        targetView.style.display = "block";
        titleEl.textContent = "Tracked Keywords Management";
        loadFullKeywordsTable(); // Function to populate table
    } else if (viewName === 'leads') {
        targetView.style.display = "block";
        titleEl.textContent = "Captured Leads Archive";
        loadFullLeadsTable(); // Function to populate table
    } else if (viewName === 'settings') {
        targetView.style.display = "block";
        titleEl.textContent = "System Settings";
    }
}

async function loadFullKeywordsTable() {
    const container = document.getElementById("fullKeywordTableContainer");
    try {
        const res = await fetch(`${API_URL}/keywords/`);
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
                            <td style="padding: 10px;"><button onclick="deleteKeyword(${kw.id}); loadFullKeywordsTable();" style="background: #e53e3e; padding: 4px 8px; font-size: 0.8rem;">Delete</button></td>
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
    try {
        const res = await fetch(`${API_URL}/leads/`);
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
                            <td style="padding: 10px;"><button onclick="deleteLead(${l.id}); loadFullLeadsTable();" style="background: #e53e3e; padding: 4px 8px; font-size: 0.8rem;">Delete</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (err) {
        console.error("Error loading leads table:", err);
    }
}
document.addEventListener("DOMContentLoaded", () => {
    // Existing initializations...
    loadSettings();
    document.getElementById("saveSettingsBtn").addEventListener("click", saveSettings);
});

function saveSettings() {
    const apiUrl = document.getElementById("settingApiUrl").value.trim();
    const pollInterval = document.getElementById("settingPollInterval").value.trim();

    // Save to browser localStorage
    localStorage.setItem("sld_api_url", apiUrl);
    localStorage.setItem("sld_poll_interval", pollInterval);

    // Show visual confirmation message
    const statusMsg = document.getElementById("settingsStatus");
    statusMsg.style.opacity = "1";

    setTimeout(() => {
        statusMsg.style.opacity = "0";
    }, 3000);
}

function loadSettings() {
    const savedApiUrl = localStorage.getItem("sld_api_url");
    const savedPollInterval = localStorage.getItem("sld_poll_interval");

    if (savedApiUrl) document.getElementById("settingApiUrl").value = savedApiUrl;
    if (savedPollInterval) document.getElementById("settingPollInterval").value = savedPollInterval;
}