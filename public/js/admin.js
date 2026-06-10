document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('admin-menu-toggle');
  const sidebar = document.querySelector('.admin-sidebar');

  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('hidden');
      sidebar.classList.toggle('fixed');
      sidebar.classList.toggle('inset-y-0');
      sidebar.classList.toggle('left-0');
      sidebar.classList.toggle('z-50');
      sidebar.classList.toggle('flex');
    });
  }
});
