document.addEventListener("DOMContentLoaded", () => {
    const openButton = document.querySelector(".create-post-btn");
    
    if (openButton) {
        openButton.addEventListener("click", openModal);
    }

    // Function to load the modal content dynamically
    function openModal() {
        // Check if modal is already injected into the DOM
        if (!document.getElementById("createPostModal")) {
            fetch("./../modal/createPost.html")
                .then(response => response.text())
                .then(html => {
                    // Inject the modal HTML into the body
                    document.body.insertAdjacentHTML("beforeend", html);

                    const modal = document.getElementById("createPostModal");
                    const closeBtn = modal.querySelector(".close-btn");

                    // Show the modal
                    modal.style.display = "flex"; 

                    // Close the modal when the close button (×) is clicked
                    closeBtn.addEventListener("click", () => {
                        modal.style.display = "none";
                    });

                    // Close the modal if clicked outside of it
                    window.addEventListener("click", (e) => {
                        if (e.target === modal) {
                            modal.style.display = "none";
                        }
                    });

                    // Handle form submission (optional)
                    const form = document.getElementById("createPostForm");
                    form.addEventListener("submit", (e) => {
                        e.preventDefault();
                        console.log("Post Published!");
                        modal.style.display = "none";
                        form.reset(); // Optionally reset form
                    });
                })
                .catch(err => console.error("Error loading modal:", err));
        } else {
            // If modal is already injected, just show it
            document.getElementById("createPostModal").style.display = "flex";
        }
    }

    // Dropdown handling (for other functionalities you may have)
    document.querySelectorAll(".dropdown").forEach(dropdown => {
        const toggle = dropdown.querySelector(".dropdown-toggle");
        toggle.addEventListener("click", evt => {
            evt.stopPropagation();
            dropdown.classList.toggle("active");
            document.querySelectorAll(".dropdown").forEach(other => {
                if (other !== dropdown) other.classList.remove("active");
            });
        });
    });

    document.addEventListener("click", () => {
        document.querySelectorAll(".dropdown").forEach(d => d.classList.remove("active"));
    });
});
