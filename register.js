// CONFIGURACIÓN SUPABASE

const SUPABASE_URL = "https://sxangxdumgoarftpidex.supabase.co";

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4YW5neGR1bWdvYXJmdHBpZGV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMTAyNjQsImV4cCI6MjA5NTc4NjI2NH0.YIrylgNL3n8vzROjxLLyFTT_k1-TowcLQ0ALjNZzLYc";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


// REGISTRO

const registerForm = document.getElementById("registerForm");

if(registerForm){

    registerForm.addEventListener("submit", async function(e){

        e.preventDefault();

        const name = document.getElementById("nameInput").value.trim();
        const discord = document.getElementById("discordInput").value.trim();
        const email = document.getElementById("emailInput").value.trim();
        const country = document.getElementById("countryInput").value.trim();
        const password = document.getElementById("passwordInput").value.trim();
        const experience = document.getElementById("experienceInput").value;
        const reason = document.getElementById("reasonInput").value.trim();

        const messageBox = document.getElementById("messageBox");

        function clearErrors(){
            const inputs = [
                "nameInput",
                "discordInput",
                "emailInput",
                "countryInput",
                "passwordInput",
                "reasonInput"
            ];

            const errors = [
                "nameError",
                "discordError",
                "emailError",
                "countryError",
                "passwordError",
                "reasonError"
            ];

            inputs.forEach(id => {
                document.getElementById(id).classList.remove("input-error");
            });

            errors.forEach(id => {
                document.getElementById(id).style.display = "none";
            });
        }

        function showError(inputId, errorId){
            document.getElementById(inputId).classList.add("input-error");
            document.getElementById(errorId).style.display = "block";
        }

        clearErrors();

        let valid = true;

        if(!name){
            showError("nameInput", "nameError");
            valid = false;
        }

        if(!discord){
            showError("discordInput", "discordError");
            valid = false;
        }

        if(!email){
            showError("emailInput", "emailError");
            valid = false;
        }

        if(!country){
            showError("countryInput", "countryError");
            valid = false;
        }

        if(!password){
            showError("passwordInput", "passwordError");
            valid = false;
        }

        if(!reason){
            showError("reasonInput", "reasonError");
            valid = false;
        }

        if(!valid){
            if(messageBox){
                messageBox.style.color = "#c2410c";
                messageBox.textContent = "Completa los campos marcados en rojo.";
            }
            return;
        }

        const { data, error } = await supabaseClient.auth.signUp({

            email: email,
            password: password,

            options: {
                data: {
                    name: name,
                    discord: discord,
                    country: country,
                    experience: experience,
                    reason: reason
                }
            }

        });

        if(error){

            console.error(error);

            if(messageBox){
                messageBox.style.color = "#c2410c";
                messageBox.textContent = error.message;
            }

            return;
        }

        const { error: insertError } = await supabaseClient
            .from("applicants")
            .insert([
                {
                    name: name,
                    discord: discord,
                    email: email,
                    country: country,
                    experience: experience,
                    reason: reason
                }
            ]);

        if(insertError){

            console.error(insertError);

            if(messageBox){
                messageBox.style.color = "#c2410c";
                messageBox.textContent = "La cuenta fue creada, pero hubo un error guardando los datos del formulario.";
            }

            return;
        }

        if(messageBox){
            messageBox.textContent = "";
        }

        const successModal = document.getElementById("successModal");

        if(successModal){
            successModal.style.display = "flex";
        }

    });

}