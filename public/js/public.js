document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menu-toggle');
  const menuClose = document.getElementById('menu-close');
  const mobileMenu = document.getElementById('mobile-menu');

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      mobileMenu.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    });
  }

  const closeMenu = () => {
    if (!mobileMenu) return;
    mobileMenu.classList.add('hidden');
    document.body.style.overflow = '';
  };

  if (menuClose) {
    menuClose.addEventListener('click', closeMenu);
  }

  if (mobileMenu) {
    mobileMenu.addEventListener('click', (event) => {
      if (event.target === mobileMenu) {
        closeMenu();
      }
    });
  }

  const header = document.querySelector('[data-site-header]');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('shadow-sm', window.scrollY > 20);
    });
  }
});
