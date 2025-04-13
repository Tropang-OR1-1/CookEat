
function toggleNotifications(event) {
    if (event) event.preventDefault(); 
    const panel = document.getElementById('notificationPanel');
    panel.classList.toggle('hidden');
  }  
  
  // Sample notifications (replace with database call later)
  const allNotifications = [
    { id: 1, sender: 'Bernie', message: 'liked your post.', unread: true, avatar: 'avatar1.jpg', time: '2m' },
    { id: 2, sender: 'Michael', message: 'commented: "Sarap pre!”', unread: false, avatar: 'avatar2.jpg', time: '10m' },
    { id: 3, sender: 'Jay', message: 'shared your recipe.', unread: true, avatar: 'avatar3.jpg', time: '1h' },
  ];

  // Switch between All / Unread tabs
  function showAll() {
    setActiveTab('All');
    renderNotifications(allNotifications);
  }

  function showUnread() {
    setActiveTab('Unread');
    const unread = allNotifications.filter(n => n.unread);
    renderNotifications(unread);
  }

  function setActiveTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.remove('active');
    });
    const activeTab = [...document.querySelectorAll('.tab')].find(tab =>
      tab.textContent.trim().toLowerCase() === tabName.toLowerCase()
    );
    if (activeTab) activeTab.classList.add('active');
  }

  // Render notifications to the panel
  function renderNotifications(notifications) {
    const list = document.getElementById('notificationList');
    const emptyState = document.getElementById('emptyState');
    list.innerHTML = '';

    if (notifications.length === 0) {
      emptyState.style.display = 'block';
    } else {
      emptyState.style.display = 'none';
      notifications.forEach(notif => {
        const li = document.createElement('li');
        li.className = 'notification-item';
        li.innerHTML = `
          <img src="${notif.avatar}" class="avatar" alt="Avatar">
          <div class="text-content">
            <p><strong>${notif.sender}</strong> ${notif.message}</p>
            <span class="time">${notif.time}</span>
          </div>
          ${notif.unread ? '<span class="dot"></span>' : ''}
        `;
        list.appendChild(li);
      });
    }
  }

  // Initialize with all notifications
  document.addEventListener('DOMContentLoaded', () => {
    renderNotifications(allNotifications);
  });

