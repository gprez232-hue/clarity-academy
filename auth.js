const loggedIn = localStorage.getItem("clarityLoggedIn");
const username = localStorage.getItem("clarityUsername");

/* 1. Bloquear páginas privadas */
const privatePage = document.body.dataset.private === "true";

if(privatePage && loggedIn !== "true"){
    document.body.innerHTML = `
        <div style="min-height:100vh;display:flex;justify-content:center;align-items:center;background:#f4f9ff;padding:20px;font-family:Arial, Helvetica, sans-serif;">
            <div style="background:white;padding:40px;border-radius:20px;text-align:center;max-width:500px;border:1px solid #d8eefc;box-shadow:0 20px 45px rgba(8,43,99,0.12);">
                <h1 style="color:#082B63;margin-bottom:15px;">Contenido privado</h1>
                <p style="color:#4b5563;line-height:1.6;margin-bottom:25px;">
                    Debes iniciar sesión para acceder al contenido de la academia.
                </p>
                <a href="login.html" style="display:inline-block;background:#1565c0;color:white;text-decoration:none;padding:12px 24px;border-radius:8px;margin-right:10px;font-weight:700;">
                    Iniciar sesión
                </a>
                <a href="register.html" style="display:inline-block;color:#1565c0;text-decoration:none;font-weight:700;">
                    Registrarme
                </a>
            </div>
        </div>
    `;
}

/* 2. Cambiar Login/Register por Hola usuario */
const authArea = document.getElementById("authArea");

if(authArea && loggedIn === "true"){
    authArea.innerHTML = `
        <span style="color:white;font-size:13px;font-weight:700;">
            Hola, ${username || "usuario"}
        </span>

        <a href="#" id="logoutBtn" class="register-link">
            Cerrar sesión
        </a>
    `;

    document.getElementById("logoutBtn").addEventListener("click", function(e){
        e.preventDefault();

        localStorage.removeItem("clarityLoggedIn");
        localStorage.removeItem("clarityUsername");

        window.location.href = "index.html";
    });
}