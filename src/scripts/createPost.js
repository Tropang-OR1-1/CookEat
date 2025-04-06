// Handle form submission (this can later be upgraded to send to a backend)
document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("createPostForm");
  
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const title = document.getElementById("postTitle").value;
      const content = document.getElementById("postContent").value;
      console.log("Post submitted:", title, content);
  
      // Redirect or show confirmation
      alert("Post created!");
      window.location.href = "index.html"; // or your main feed page
    });
  });
  