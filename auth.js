(async function(){

    const AUTH_SUPABASE_URL = "https://sxangxdumgoarftpidex.supabase.co";

    const AUTH_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4YW5neGR1bWdvYXJmdHBpZGV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMTAyNjQsImV4cCI6MjA5NTc4NjI2NH0.YIrylgNL3n8vzROjxLLyFTT_k1-TowcLQ0ALjNZzLYc";

    const authSupabase = supabase.createClient(
        AUTH_SUPABASE_URL,
        AUTH_SUPABASE_ANON_KEY
    );

    const authArea = document.getElementById("authArea");

    if(!authArea){
        return;
    }

    const { data } = await authSupabase.auth.getUser();

    if(data.user){

        const username =
            data.user.user_metadata?.name ||
            data.user.email.split("@")[0];

        authArea.innerHTML = `
            <span style="color:white;font-size:13px;font-weight:700;">
                Hola, ${username}
            </span>

            <a href="#" id="logoutBtn" class="register-link">
                Cerrar sesión
            </a>
        `;

        document.getElementById("logoutBtn").addEventListener("click", async function(e){

    e.preventDefault();

    const loadingModal = document.getElementById("loadingModal");

    if(loadingModal){
        loadingModal.querySelector("p").textContent = "Cerrando sesión...";
        loadingModal.style.display = "flex";
    }

    await authSupabase.auth.signOut();

    localStorage.removeItem("clarityLoggedIn");
    localStorage.removeItem("clarityUsername");

    setTimeout(() => {
        window.location.href = "index.html";
    }, 800);

});

    }

})();