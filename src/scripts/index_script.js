document.addEventListener("DOMContentLoaded", function () {
    const loginBtn = document.querySelector(".login-btn");

    loginBtn.addEventListener("click", function (event) {
        event.preventDefault(); // Prevent actual form submission
        alert("Login functionality coming soon!");
    });
});
