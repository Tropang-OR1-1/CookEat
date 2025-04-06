document.addEventListener("DOMContentLoaded", function () {
    fetch("/src/modal/login.html")
        .then(response => response.text())
        .then(html => {
            document.getElementById("loginModal").innerHTML = html;
            attachEventListeners();
        })
        .catch(error => console.error("Error loading modal:", error));
});

function attachEventListeners() {
    const modal = document.getElementById("loginModal");
    if (!modal) {
        console.error("Modal not found!");
        return;
    }

    // Select post buttons and dropdown links
    const modalTriggers = document.querySelectorAll(
        ".post-buttons .button, .dropdown-content a, .dropdown-toggle"
    );

    modalTriggers.forEach(trigger => {
        trigger.addEventListener("click", function (event) {
            event.preventDefault();
            openModal();
        });
    });

    const closeButton = modal.querySelector(".close");
    if (closeButton) {
        closeButton.addEventListener("click", closeModal);
    }

    // Close modal when clicking outside
    window.addEventListener("click", function (event) {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Register and login toggle logic
    const container = modal.querySelector(".container");
    const registerBtn = modal.querySelector(".register-btn");
    const loginBtn = modal.querySelector(".login-btn");

    if (registerBtn && loginBtn && container) {
        registerBtn.addEventListener("click", () => {
            container.classList.add("active");
        });

        loginBtn.addEventListener("click", () => {
            container.classList.remove("active");
        });
    } else {
        console.error("Register or Login buttons not found!");
    }

    // ADD LOGIN EVENT LISTENER
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", function (event) {
            event.preventDefault();
            login(); // Call the login function
        });
    } else {
        console.error("Login form not found!");
    }

    // ADD REGISTER EVENT LISTENER
    const RegisterForm = document.getElementById("registerForm");
    if (RegisterForm) {
        RegisterForm.addEventListener("submit", function (event) {
            event.preventDefault();
            register(); // Call the login function
        });
    } else {
        console.error("Register form not found!");
    }
}


function openModal() {
    const modal = document.getElementById("loginModal");
    if (modal) {
        modal.style.display = "flex";
        setTimeout(() => {
            modal.classList.add("show");
        }, 10);
    }
}

function closeModal() {
    const modal = document.getElementById("loginModal");
    if (modal) {
        modal.classList.remove("show");
        setTimeout(() => {
            modal.style.display = "none";
        }, 300);
    }
}

function login() {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    
    url = "http://localhost:3000/login"; // Replace with your actual login URL
    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
        })
        .then(response => response.json())  // Convert response to JSON
        .then(data => alert(data.token))  // Log the token directly
        .catch(error => alert(error)); // Handle errors
    

}


function register() {
    const username = document.getElementById("registerUsername").value;
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;

    url = "http://localhost:3000/register"; // Replace with your actual register URL
    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, email, password })
    })
        .then(response => response.json())  // Convert response to JSON
        .then(data => alert(data.token))  // Log the token directly
        .catch(error => alert(error)); // Handle errors
}
