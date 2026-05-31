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

const reasonModal = document.getElementById("reasonModal");
const reasonText = document.getElementById("reasonText");
const closeReasonModal = document.getElementById("closeReasonModal");

async function loadAdminPanel(){

    const { data: userData, error: userError } = await adminSupabase.auth.getUser();

    if(userError || !userData.user){
        window.location.href = "login.html";
        return;
    }

    const userEmail = userData.user.email;

    const { data: adminData, error: adminError } = await adminSupabase
    .from("admins")
    .select("*")
    .ilike("email", userEmail)
    .maybeSingle();

alert(
    "Email logueado: " + userEmail +
    "\nAdmin encontrado: " + JSON.stringify(adminData) +
    "\nError: " + JSON.stringify(adminError)
);

if(adminError || !adminData){
    window.location.href = "no-access.html";
    return;
}

    const { data: applicants, error: applicantsError } = await adminSupabase
        .from("Applicants")
        .select("*")
        .order("created_at", { ascending: false });

    if(applicantsError){
        console.error(applicantsError);
        statusMessage.textContent = "Error cargando postulantes.";
        hideLoading();
        return;
    }

    renderApplicants(applicants);
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

        const button = row.querySelector(".reason-button");

        button.addEventListener("click", function(){
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
