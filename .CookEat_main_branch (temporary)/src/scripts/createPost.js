// Get modal and button elements
const modal = document.getElementById('createPostModal');
const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtn = document.getElementsByClassName('close-btn')[0];

// Function to open the modal
function openModal() {
    modal.style.display = 'flex'; // Show modal
}

// Function to close the modal
function closeModal() {
    modal.style.display = 'none'; // Hide modal
}

// Close modal when the close button (×) is clicked
closeModalBtn.onclick = function() {
    closeModal(); // Close the modal
}

// Close modal when clicking outside the modal
window.onclick = function(event) {
    if (event.target === modal) {
        closeModal(); // Close the modal
    }
}

// Handle form submission
const createPostForm = document.getElementById('createPostForm');
createPostForm.onsubmit = function(e) {
    e.preventDefault(); // Prevent form from reloading the page

    const postTitle = document.getElementById('postTitle').value;
    const caption = document.getElementById('caption').value;
    const media = document.getElementById('media').files[0];
    const instructions = document.getElementById('instructions').value;
    const ingredients = document.getElementById('ingredients').value;

    // Form validation
    if (!postTitle || !instructions || !ingredients) {
        alert('Please fill in the required fields.');
        return;
    }

    // Create a new post object (you can later send this to the server)
    const newPost = {
        postTitle,
        caption,
        media,
        instructions,
        ingredients
    };

    console.log('New Post:', newPost);

    // Close the modal after submitting
    closeModal();

    // Optionally reset form inputs after submitting
    createPostForm.reset();
}
