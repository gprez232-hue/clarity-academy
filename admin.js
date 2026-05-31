const ADMIN_SUPABASE_URL = "https://sxangxdumgoarftpidex.supabase.co";

const ADMIN_SUPABASE_ANON_KEY = "TU_ANON_KEY_AQUI";

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
