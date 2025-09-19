// nav-active.js

// Get current page filename
const currentPath = window.location.pathname;
const currentPage = currentPath.substring(currentPath.lastIndexOf('/') + 1) || "index.html";

// Highlight nav links
const links = document.querySelectorAll('.nav-link');
links.forEach(link => {
  const linkPage = link.getAttribute('href');
  if(linkPage === currentPage) {
    link.classList.add('active');
  } else {
    link.classList.remove('active');
  }
});

// Highlight nav buttons
const btnLinks = document.querySelectorAll('.nav-actions .btn');
btnLinks.forEach(btn => {
  const btnPage = btn.getAttribute('href');
  if(btnPage === currentPage) {
    btn.classList.add('active');
  } else {
    btn.classList.remove('active');
  }
});
