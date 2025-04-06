document.addEventListener("DOMContentLoaded", function () {
    const dropdowns = document.querySelectorAll(".dropdown");

    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector(".dropdown-toggle");

        toggle.addEventListener("click", function (event) {
            event.stopPropagation();
            const isActive = dropdown.classList.contains("active");

            // Close all other dropdowns
            dropdowns.forEach(d => {
                d.classList.remove("active");
                const t = d.querySelector(".dropdown-toggle");
                if (t) t.setAttribute("aria-expanded", "false");
            });

            dropdown.classList.toggle("active");
            toggle.setAttribute("aria-expanded", String(!isActive));
        });
    });

    // Global click to close all dropdowns
    document.addEventListener("click", function () {
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove("active");
            const t = dropdown.querySelector(".dropdown-toggle");
            if (t) t.setAttribute("aria-expanded", "false");
        });
    });

    // Toggle clicked style on action buttons
    document.querySelectorAll('.button').forEach(button => {
        button.addEventListener('click', function () {
            this.classList.toggle('clicked');
        });
    });
});
