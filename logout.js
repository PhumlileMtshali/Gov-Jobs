document.addEventListener("DOMContentLoaded", () => {
  const logoutBtns = document.querySelectorAll(".logout-btn");

  logoutBtns.forEach(btn => {
    btn.addEventListener("click", (event) => {
      event.preventDefault(); // prevent default link action
      const confirmLogout = confirm("Are you sure you want to log out?");
      if (confirmLogout) {
        // Clear login token if used
        localStorage.removeItem("token");
        window.location.href = btn.href; // redirect to the link's target
      }
    });
  });
});
