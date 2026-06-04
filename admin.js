const ADMIN_SUPABASE_URL = "https://sxangxdumgoarftpidex.supabase.co";

const ADMIN_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4YW5neGR1bWdvYXJmdHBpZGV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMTAyNjQsImV4cCI6MjA5NTc4NjI2NH0.YIrylgNL3n8vzROjxLLyFTT_k1-TowcLQ0ALjNZzLYc";

const adminSupabase = supabase.createClient(
    ADMIN_SUPABASE_URL,
    ADMIN_SUPABASE_ANON_KEY
);

const loadingModal = document.getElementById("loadingModal");
const statusMessage = document.getElementById("statusMessage");
const applicantsTable = document.getElementById("applicantsTable");
const applicantCount = document.getElementById("applicantCount");
const progressTable = document.getElementById("progressTable");
const progressCount = document.getElementById("progressCount");

const playerSettingsTable = document.getElementById("playerSettingsTable");
const playerSettingsCount = document.getElementById("playerSettingsCount");

const monthlyUpdatesTable = document.getElementById("monthlyUpdatesTable");
const monthlyUpdatesCount = document.getElementById("monthlyUpdatesCount");

const reasonModal = document.getElementById("reasonModal");
const reasonText = document.getElementById("reasonText");
const closeReasonModal = document.getElementById("closeReasonModal");

document.querySelectorAll(".collapsible-card .admin-topbar").forEach(topbar => {
    topbar.addEventListener("click", function(){
        const card = this.closest(".collapsible-card");
        card.classList.toggle("open");
    });
});

async function loadAdminPanel(){

    const { data: sessionData } = await adminSupabase.auth.getSession();

    if(!sessionData.session){
        window.location.href = "login.html";
        return;
    }

    const userEmail = sessionData.session.user.email.toLowerCase();

    const { data: adminData, error: adminError } = await adminSupabase
        .from("admins")
        .select("*")
        .ilike("email", userEmail)
        .maybeSingle();

    if(adminError || !adminData){
        window.location.href = "no_access.html";
        return;
    }

    const { data: applicants, error: applicantsError } = await adminSupabase
        .from("applicants")
        .select("*")
        .order("created_at", { ascending: false });

    if(applicantsError){
        console.error(applicantsError);
        statusMessage.textContent = "Error cargando postulantes.";
        hideLoading();
        return;
    }

    renderApplicants(applicants);

    await loadCourseProgress();
    await loadPlayerSettings();
    await loadMonthlyUpdates();

    hideLoading();
}

function renderApplicants(applicants){

    applicantsTable.innerHTML = "";

    if(!applicants || applicants.length === 0){
        applicantCount.textContent = "0 postulantes";
        statusMessage.textContent = "Todavía no hay postulantes registrados.";
        return;
    }

    applicantCount.textContent =
        applicants.length === 1
        ? "1 postulante"
        : `${applicants.length} postulantes`;

    statusMessage.textContent = "";

    applicants.forEach(applicant => {

        const row = document.createElement("tr");

        const createdDate = applicant.created_at
            ? new Date(applicant.created_at).toLocaleDateString("es-AR")
            : "-";

        row.innerHTML = `
            <td>${escapeHTML(applicant.name || "-")}</td>
            <td>${escapeHTML(applicant.discord || "-")}</td>
            <td>${escapeHTML(applicant.email || "-")}</td>
            <td>${escapeHTML(applicant.country || "-")}</td>
            <td>${escapeHTML(applicant.experience || "-")}</td>
            <td>${createdDate}</td>
            <td>
                <button class="reason-button">
                    Ver motivo
                </button>
            </td>
        `;

        row.querySelector(".reason-button").addEventListener("click", function(){
            openReasonModal(applicant.reason || "Sin motivo registrado.");
        });

        applicantsTable.appendChild(row);
    });
}

async function loadCourseProgress(){

    const { data: progress, error } = await adminSupabase
        .from("module_progress")
        .select("*")
        .order("user_email", { ascending:true })
        .order("module_id", { ascending:true });

    if(error){
        console.error(error);
        progressTable.innerHTML = `
            <tr>
                <td colspan="5">Error cargando progreso del curso.</td>
            </tr>
        `;
        return;
    }

    renderCourseProgress(progress);
}

function renderCourseProgress(progress){

    progressTable.innerHTML = "";

    if(!progress || progress.length === 0){
        progressCount.textContent = "0 alumnos";
        progressTable.innerHTML = `
            <tr>
                <td colspan="5">Todavía no hay progreso registrado.</td>
            </tr>
        `;
        return;
    }

    const grouped = {};

    progress.forEach(row => {
        const email = row.user_email || "Sin email";

        if(!grouped[email]){
            grouped[email] = [];
        }

        grouped[email].push(row);
    });

    const emails = Object.keys(grouped);

    progressCount.textContent =
        emails.length === 1
        ? "1 alumno"
        : `${emails.length} alumnos`;

    emails.forEach(email => {

        const modules = grouped[email];
        const completedCount = modules.filter(m => m.completed).length;

        const headerRow = document.createElement("tr");

        headerRow.innerHTML = `
            <td colspan="5" style="
                background:#e5f6ff;
                color:#082B63;
                font-weight:900;
            ">
                <div style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    gap:15px;
                ">
                    <span>
                        ${escapeHTML(email)} — ${completedCount}/10 módulos completados
                    </span>

                    <button class="reason-button toggle-progress">
                        Ver progreso
                    </button>
                </div>
            </td>
        `;

        progressTable.appendChild(headerRow);

        const moduleRows = [];

        modules
            .sort((a, b) => {
                const numA = parseInt(String(a.module_id).replace("modulo_", ""));
                const numB = parseInt(String(b.module_id).replace("modulo_", ""));
                return numA - numB;
            })
            .forEach(row => {

                const tr = document.createElement("tr");
                tr.style.display = "none";

                const updatedDate = row.updated_at
                    ? new Date(row.updated_at).toLocaleString("es-AR")
                    : "-";

                tr.innerHTML = `
                    <td></td>
                    <td>${escapeHTML(row.module_id || "-")}</td>
                    <td>${row.completed ? "✅ Sí" : "❌ No"}</td>
                    <td>${updatedDate}</td>
                    <td>
                        <button class="reason-button">
                            Ver notas
                        </button>
                    </td>
                `;

                tr.querySelector(".reason-button").addEventListener("click", function(){
                    openReasonModal(row.notes || "Sin notas registradas.");
                });

                moduleRows.push(tr);
                progressTable.appendChild(tr);
            });

        headerRow.querySelector(".toggle-progress").addEventListener("click", function(){

            const isHidden = moduleRows[0]?.style.display === "none";

            moduleRows.forEach(row => {
                row.style.display = isHidden ? "table-row" : "none";
            });

            this.textContent = isHidden ? "Ocultar progreso" : "Ver progreso";
        });
    });
}

async function loadPlayerSettings(){

    if(!playerSettingsTable){
        return;
    }

    const { data, error } = await adminSupabase
        .from("user_bankrolls")
        .select("*")
        .order("user_email", { ascending:true });

    if(error){
        console.error(error);
        playerSettingsTable.innerHTML = `
            <tr>
                <td colspan="6">Error cargando configuración de jugadores.</td>
            </tr>
        `;
        return;
    }

    renderPlayerSettings(data || []);
}

function renderPlayerSettings(players){

    playerSettingsTable.innerHTML = "";

    if(!players || players.length === 0){
        playerSettingsCount.textContent = "0 jugadores";
        playerSettingsTable.innerHTML = `
            <tr>
                <td colspan="6">
                    Todavía no hay jugadores configurados. Puedes crear uno escribiendo un email y guardando.
                </td>
            </tr>
        `;
    }else{
        playerSettingsCount.textContent =
            players.length === 1
            ? "1 jugador"
            : `${players.length} jugadores`;

        players.forEach(player => {
            addPlayerSettingsRow(player);
        });
    }

    addEmptyPlayerSettingsRow();
}

function addPlayerSettingsRow(player = {}){

    const row = document.createElement("tr");

    row.innerHTML = `
        <td>
            <input class="admin-input player-email" value="${escapeHTML(player.user_email || "")}" placeholder="email@ejemplo.com">
        </td>

        <td>
            <input class="admin-input player-bankroll" value="${escapeHTML(player.bankroll || "")}" placeholder="Ej: 100">
        </td>

        <td>
            <input class="admin-input player-level" value="${escapeHTML(player.assigned_level || "")}" placeholder="Ej: 1s / 2s / 5s">
        </td>

        <td>
            <input class="admin-input player-room" value="${escapeHTML(player.assigned_room || "")}" placeholder="Ej: Champion Poker">
        </td>

        <td>
            <input class="admin-input player-coach" value="${escapeHTML(player.assigned_coach || "")}" placeholder="Ej: Gonzalo">
        </td>

        <td>
            <button class="reason-button save-player-settings">
                Guardar
            </button>
        </td>
    `;

    row.querySelector(".save-player-settings").addEventListener("click", async function(){
        await savePlayerSettingsRow(row);
    });

    playerSettingsTable.appendChild(row);
}

function addEmptyPlayerSettingsRow(){

    const row = document.createElement("tr");

    row.innerHTML = `
        <td>
            <input class="admin-input player-email" placeholder="nuevo@email.com">
        </td>

        <td>
            <input class="admin-input player-bankroll" placeholder="Ej: 100">
        </td>

        <td>
            <input class="admin-input player-level" placeholder="Ej: 1s">
        </td>

        <td>
            <input class="admin-input player-room" placeholder="Ej: Champion Poker">
        </td>

        <td>
            <input class="admin-input player-coach" placeholder="Ej: Gonzalo">
        </td>

        <td>
            <button class="reason-button save-player-settings">
                Crear / Guardar
            </button>
        </td>
    `;

    row.querySelector(".save-player-settings").addEventListener("click", async function(){
        await savePlayerSettingsRow(row);
    });

    playerSettingsTable.appendChild(row);
}

async function savePlayerSettingsRow(row){

    const email = row.querySelector(".player-email").value.trim().toLowerCase();
    const bankroll = row.querySelector(".player-bankroll").value.trim();
    const level = row.querySelector(".player-level").value.trim();
    const room = row.querySelector(".player-room").value.trim();
    const coach = row.querySelector(".player-coach").value.trim();

    if(!email){
        openReasonModal("Debes escribir un email para guardar la configuración del jugador.");
        return;
    }

    const { error } = await adminSupabase
        .from("user_bankrolls")
        .upsert({
            user_email: email,
            bankroll: bankroll,
            assigned_level: level,
            assigned_room: room,
            assigned_coach: coach,
            updated_at: new Date().toISOString()
        }, {
            onConflict: "user_email"
        });

    if(error){
        console.error(error);
        openReasonModal("Error guardando configuración del jugador.");
        return;
    }

    openReasonModal("Configuración del jugador guardada correctamente ✅");
    await loadPlayerSettings();
}

async function loadMonthlyUpdates(){

    if(!monthlyUpdatesTable){
        return;
    }

    const { data, error } = await adminSupabase
        .from("player_monthly_updates")
        .select("*")
        .order("user_email", { ascending:true })
        .order("month", { ascending:true });

    if(error){
        console.error(error);
        monthlyUpdatesTable.innerHTML = `
            <tr>
                <td colspan="6">Error cargando actualizaciones mensuales.</td>
            </tr>
        `;
        return;
    }

    renderMonthlyUpdates(data || []);
}

function renderMonthlyUpdates(updates){

    monthlyUpdatesTable.innerHTML = "";

    if(!updates || updates.length === 0){
        monthlyUpdatesCount.textContent = "0 jugadores";
        monthlyUpdatesTable.innerHTML = `
            <tr>
                <td colspan="6">Todavía no hay actualizaciones mensuales registradas.</td>
            </tr>
        `;
        return;
    }

    const grouped = {};

    updates.forEach(update => {
        const email = update.user_email || "Sin email";

        if(!grouped[email]){
            grouped[email] = [];
        }

        grouped[email].push(update);
    });

    const emails = Object.keys(grouped);

    monthlyUpdatesCount.textContent =
        emails.length === 1
        ? "1 jugador"
        : `${emails.length} jugadores`;

    emails.forEach(email => {

        const months = grouped[email];

        const row = document.createElement("tr");

        const options = months.map((item, index) => {
            return `
                <option value="${index}">
                    ${escapeHTML(item.month || "-")}
                </option>
            `;
        }).join("");

        row.innerHTML = `
            <td>${escapeHTML(email)}</td>

            <td>
                <select class="month-selector">
                    ${options}
                </select>
            </td>

            <td class="monthly-tournaments"></td>
            <td class="monthly-allin"></td>
            <td class="monthly-bankroll"></td>
            <td class="monthly-updated"></td>
        `;

        const selector = row.querySelector(".month-selector");
        const tournamentsCell = row.querySelector(".monthly-tournaments");
        const allinCell = row.querySelector(".monthly-allin");
        const bankrollCell = row.querySelector(".monthly-bankroll");
        const updatedCell = row.querySelector(".monthly-updated");

        function updateVisibleMonth(index){
            const selected = months[index];

            tournamentsCell.textContent = selected?.tournaments ?? "-";
            allinCell.textContent = selected?.all_in_adj ?? "-";
            bankrollCell.textContent = selected?.bankroll ?? "-";

            updatedCell.textContent = selected?.updated_at
                ? new Date(selected.updated_at).toLocaleString("es-AR")
                : "-";
        }

        selector.addEventListener("change", function(){
            updateVisibleMonth(Number(this.value));
        });

        updateVisibleMonth(0);

        monthlyUpdatesTable.appendChild(row);
    });
}

function openReasonModal(reason){
    reasonText.textContent = reason;
    reasonModal.style.display = "flex";
}

function closeModal(){
    reasonModal.style.display = "none";
}

if(closeReasonModal){
    closeReasonModal.addEventListener("click", closeModal);
}

if(reasonModal){
    reasonModal.addEventListener("click", function(e){
        if(e.target === reasonModal){
            closeModal();
        }
    });
}

function hideLoading(){
    if(loadingModal){
        loadingModal.style.display = "none";
    }
}

function escapeHTML(text){
    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

loadAdminPanel();