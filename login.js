const SUPABASE_URL = "https://sxangxdumgoarftpidex.supabase.co";

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4YW5neGR1bWdvYXJmdHBpZGV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMTAyNjQsImV4cCI6MjA5NTc4NjI2NH0.YIrylgNL3n8vzROjxLLyFTT_k1-TowcLQ0ALjNZzLYc";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

const loginForm = document.getElementById("loginForm");
const messageBox = document.getElementById("messageBox");

if(loginForm){
    loginForm.addEventListener("submit", async function(e){
        e.preventDefault();

        const email = document.getElementById("emailInput").value.trim();
        const password = document.getElementById("passwordInput").value.trim();

        if(!email || !password){
            messageBox.style.color = "#c2410c";
            messageBox.textContent = "Introduce tu email y contraseña.";
            return;
        }

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if(error){
    messageBox.style.color = "#c2410c";

    if(error.message.toLowerCase().includes("email not confirmed")){
        messageBox.textContent = "Debes verificar tu correo antes de iniciar sesión.";
    }else{
        messageBox.textContent = "Email o contraseña incorrectos.";
    }

    return;
}

        const username =
            data.user.user_metadata?.name ||
            email.split("@")[0];

        localStorage.setItem("clarityLoggedIn", "true");
        localStorage.setItem("clarityUsername", username);

        window.location.href = "index.html";
    });
}

loginForm.addEventListener("submit", async function(e){
    e.preventDefault();

    const email = document.getElementById("emailInput").value.trim();
    const password = document.getElementById("passwordInput").value.trim();
    const loadingModal = document.getElementById("loadingModal");

    if(!email || !password){
        messageBox.style.color = "#c2410c";
        messageBox.textContent = "Introduce tu email y contraseña.";
        return;
    }

    if(loadingModal){
        loadingModal.style.display = "flex";
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if(error){
        if(loadingModal){
            loadingModal.style.display = "none";
        }

        messageBox.style.color = "#c2410c";
        messageBox.textContent = "Email o contraseña incorrectos, o email no verificado.";
        return;
    }

    const username =
        data.user.user_metadata?.name ||
        email.split("@")[0];

    localStorage.setItem("clarityLoggedIn", "true");
    localStorage.setItem("clarityUsername", username);

    setTimeout(() => {
        window.location.href = "index.html";
    }, 800);
});