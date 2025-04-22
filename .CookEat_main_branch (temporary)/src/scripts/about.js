// Tilt and Ripple Effect
document.querySelectorAll('.creator-card').forEach(card => {
    // Tilt on mousemove
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      card.style.transform = `rotateX(${-y / 20}deg) rotateY(${x / 20}deg) scale(1.05)`;
    });
  
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'rotateX(0) rotateY(0) scale(1)';
    });
  
    // Ripple on click
    card.addEventListener('click', e => {
      const ripple = card.querySelector('.ripple');
      ripple.style.left = `${e.clientX - card.getBoundingClientRect().left}px`;
      ripple.style.top = `${e.clientY - card.getBoundingClientRect().top}px`;
      ripple.classList.remove('show');
      void ripple.offsetWidth; // trigger reflow
      ripple.classList.add('show');
    });
  });
