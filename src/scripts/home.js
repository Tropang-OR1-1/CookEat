document.addEventListener("DOMContentLoaded", function () {
    const dropdowns = document.querySelectorAll(".dropdown");

    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector(".dropdown-toggle");
        const menu = dropdown.querySelector(".dropdown-menu");

        toggle.addEventListener("click", function (event) {
            event.stopPropagation();
            dropdown.classList.toggle("active");

            // Close other open dropdowns
            document.querySelectorAll(".dropdown").forEach(other => {
                if (other !== dropdown) other.classList.remove("active");
            });
        });

        document.addEventListener("click", function () {
            dropdown.classList.remove("active");
        });
    });
});

document.querySelectorAll('.button').forEach(button => {
    button.addEventListener('click', function() {
        this.classList.toggle('clicked'); // Toggles between filled and outlined state
    });
});
