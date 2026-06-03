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

const reasonModal = document.getElementById("reasonModal");
const reasonText = document.getElementById("reasonText");
const closeReasonModal = document.getElementById("closeReasonModal");

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
                const numA = parseInt(a.module_id.replace("modulo_", ""));
                const numB = parseInt(b.module_id.replace("modulo_", ""));
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
