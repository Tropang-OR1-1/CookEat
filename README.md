# Introduction
  CookEat (cookeat.cookeat.space) is a dynamic web application designed to bring people together through the universal language of food. More than just a digital recipe book, CookEat offers a social and interactive experience where users can submit their own recipes, explore unique culinary creations, and engage with a diverse community of food lovers from around the world.

  At its core, CookEat aims to revive traditional dishes and culinary heritage, honoring recipes that have been passed down through generations. These time-tested meals, often deeply tied to culture, family, and memory to find a new home on the platform, where they can be shared, preserved, and celebrated.
But CookEat isn’t only about the past. It also celebrates the creativity and innovation of newer generations, providing a space where users can experiment with flavors, invent new twists on classic dishes, and add playful, modern takes to traditional cuisine. From comforting, familiar meals to bold, humorous, or avant-garde culinary experiments, the platform reflects the full spectrum of contemporary food culture.

  What sets CookEat apart is its community-driven spirit. Users are encouraged to interact with each other, exchange ideas, and discover shared tastes. The platform’s design prioritizes ease of use, with intuitive navigation and features that allow contributors to upload content, comment on recipes, and build connections through a shared passion for cooking.
We believe that CookEat is more than just a recipe-sharing site, it’s a culinary hub that fosters connection, creativity, and cultural preservation. Whether you’re looking to relive your grandmother’s kitchen or explore the next food trend, CookEat invites you to be part of a living, growing archive of delicious ideas.

---

## Project Information:
**Project Title:** CookEat
**Project Group Name:** OR 1=1
**Project Repository:** https://github.com/Tropang-OR1-1/CookEat
**Project Group GitHub Organization:** https://github.com/Tropang-OR1-1

---

## Technologies Used
  ### Backend Tech Stack  
  - Raspberry Pi 4 Model B (Deployment)  
  - PM2 (Process management and persistence)  
  -  Node.js with Express  
  - PostgreSQL  
  - Cloudflare Tunneling (Secure backend access)

  The backend of CookEat is designed to be lightweight, scalable, and educationally hands-on—making the Raspberry Pi 4 Model B an ideal deployment environment. It serves as a compact server that supports real-world deployment while also promoting energy efficiency and cost-effectiveness. This allows the application to run continuously in a self-contained environment, suitable for both demonstration and practical use.

  To ensure the backend remains resilient, we use PM2, a production-grade process manager for Node.js. PM2 automatically restarts the server if it crashes and allows us to monitor performance and logs easily. This is crucial for a web application that needs to maintain consistent uptime and handle multiple user requests.

  At the heart of the backend logic is Node.js, chosen for its non-blocking, event-driven architecture that efficiently handles concurrent requests, especially important in a social platform where users may be constantly submitting recipes, viewing posts, or interacting with others. We use the Express.js framework to simplify the setup of RESTful API routes, enabling organized and scalable endpoints for recipe submission, user authentication, and data retrieval.

  For data persistence, we use PostgreSQL, a powerful, open-source relational database. PostgreSQL ensures that CookEat's structured data—such as users, comments, tags, and recipe metadata—is stored reliably with support for complex queries and future scalability. It also provides strong data integrity, which is essential for maintaining the accuracy of social interactions, recipe ownership, and user history.

  To securely expose the backend services, we implement Cloudflare Tunneling, which creates a secure, encrypted tunnel between the Raspberry Pi server and Cloudflare’s network. This setup protects the backend from direct exposure to the internet, reducing security risks while enabling controlled access without needing traditional VPN or complex firewall configurations.
Together, this backend stack allows CookEat to operate as a robust, modular, and scalable system tailored to the needs of a socially interactive web app, while also keeping deployment affordable and maintainable.

  ### Frontend Tech Stack  
  - React.js (with Vite for fast development)  
  - Axios (for API communication and routing)

  The frontend of CookEat is built using React.js, a powerful and flexible JavaScript library ideal for building social web applications. React’s component-based architecture allows for the creation of reusable UI elements, such as recipe posts, comment threads, user profiles, and notification panels and other essential features in any interactive social platform.

  By using React, we can efficiently manage dynamic content updates, ensuring that users see new recipes, likes, or comments in real time without needing to reload the page. Its built-in state management also makes it easier to handle user interactions smoothly, such as form submissions, live feeds, and pop-up modals.

  The development experience is further enhanced with Vite, which provides ultra-fast hot reloading and build performance. Axios is used for handling communication with the backend, ensuring seamless data fetching and routing between components. React.js was chosen because it enables us to build a scalable, interactive, and responsive UI, exactly what’s needed for a social-network-inspired recipe sharing platform like CookEat.
	
   ### System Integration
  CookEat integrates the backend and frontend through RESTful API communication. The Axios library on the client side handles all data transactions with the Express-based server. This design ensures smooth interaction between user actions (like submitting a recipe) and backend processes (such as database storage and retrieval). The use of PostgreSQL for data storage ensures that data remains consistent and accessible across the app. Hosting everything on a Raspberry Pi 4 makes the system compact and self-contained, ideal for demos and real-world deployment scenarios with minimal infrastructure.

   ### Admin Access
  To maintain security and simplicity, CookEat does not implement an admin account within the web application interface. Instead, administrative tasks and backend management are performed through a command-line interface (CLI), which allows authorized personnel to interact directly with the server environment. Additionally, we use Cloudflare to securely manage and protect backend access, providing an extra layer of security by filtering traffic and preventing unauthorized attempts. This setup ensures the backend remains safe while keeping the user-facing experience clean and focused on community interaction.
