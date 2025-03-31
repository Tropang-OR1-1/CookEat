document.addEventListener("DOMContentLoaded", function () {
    fetch("login.html")
        .then(response => response.text())
        .then(html => {
            document.getElementById("modal-container").innerHTML = html;
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

    // Select all buttons that should trigger the login modal
    const modalTriggers = document.querySelectorAll(
        ".button, .profile-dropdown a, .post-buttons button, .dropdown-item"
    );

    modalTriggers.forEach(trigger => {
        trigger.addEventListener("click", function (event) {
            event.preventDefault();
            openModal();
        });
    });

    const closeButton = document.querySelector(".close");
    if (closeButton) {
        closeButton.addEventListener("click", closeModal);
    }

    // Close modal when clicking outside
    window.addEventListener("click", function (event) {
        if (event.target === modal) {
            closeModal();
        }
    });
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

/* Diaz */

const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');

registerBtn.addEventListener('click', () => {
    container.classList.add('active');
});

loginBtn.addEventListener('click', () => {
    container.classList.remove('active');
});