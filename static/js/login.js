document.querySelectorAll(".card").forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update gradient position for the card itself
    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);

    // Update gradient position for all child elements
    card.querySelectorAll("*").forEach((child) => {
      child.style.setProperty("--mouse-x", `${x}px`);
      child.style.setProperty("--mouse-y", `${y}px`);
    });
  });
});

const coords = { x: 0, y: 0 };
const circles = document.querySelectorAll(".circle");

const colors = [
  "#ffb56b",
  "#fdaf69",
  "#f89d63",
  "#f59761",
  "#ef865e",
  "#ec805d",
  "#e36e5c",
  "#df685c",
  "#d5585c",
  "#d1525c",
  "#c5415d",
  "#c03b5d",
  "#b22c5e",
  "#ac265e",
  "#9c155f",
  "#950f5f",
  "#830060",
  "#7c0060",
  "#680060",
  "#60005f",
  "#48005f",
  "#3d005e"
];

circles.forEach(function (circle, index) {
  circle.x = 0;
  circle.y = 0;
  circle.style.backgroundColor = colors[index % colors.length];
});

window.addEventListener("mousemove", function (e) {
  coords.x = e.clientX;
  coords.y = e.clientY;

});

function animateCircles() {

  let x = coords.x;
  let y = coords.y;

  circles.forEach(function (circle, index) {
    circle.style.left = x - 12 + "px";
    circle.style.top = y - 12 + "px";

    circle.style.scale = (circles.length - index) / circles.length;

    circle.x = x;
    circle.y = y;

    const nextCircle = circles[index + 1] || circles[0];
    x += (nextCircle.x - x) * 0.3;
    y += (nextCircle.y - y) * 0.3;
  });

  requestAnimationFrame(animateCircles);
}

animateCircles();
document.addEventListener("DOMContentLoaded", () => {
  const dropdownButton = document.getElementById("dropdownButton");
  const dropdownMenu = document.getElementById("dropdownMenu");
  const dropdownItems = document.querySelectorAll(".dropdown-item");
  const loginAsHiddenInput = document.getElementById("login-as-hidden");
  const errorMessage = document.getElementById("error-message");

  // Toggle dropdown visibility
  dropdownButton.addEventListener("click", () => {
    dropdownMenu.style.display = dropdownMenu.style.display === "block" ? "none" : "block";
  });

  // Update button text, store selected value in the hidden input
  dropdownItems.forEach(item => {
    item.addEventListener("click", (event) => {
      const selectedValue = event.target.dataset.value;
      const selectedText = event.target.textContent;
      dropdownButton.textContent = `${selectedText} ▼`; // Update button text
      loginAsHiddenInput.value = selectedValue; // Set hidden input value
      dropdownMenu.style.display = "none"; // Close dropdown
    });
  });

  // Close dropdown if clicked outside
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".dropdown")) {
      dropdownMenu.style.display = "none";
    }
  });

  const loginForm = document.getElementById("loginForm");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");

  // Handle form submission
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault(); // Prevent the form from reloading the page

    const username = usernameInput.value;
    const password = passwordInput.value;
    const loginAs = loginAsHiddenInput.value; // Get the role from the hidden input

    // Basic validation
    if (!username || !password || !loginAs) {
      errorMessage.textContent = "Please fill out all fields.";
      errorMessage.style.display = "block"; // Show error message
      return;
    }

    // Prepare the data to be sent in the POST request
    const data = {
      username: username,
      password: password,
      login_as: loginAs, // Include the selected role
    };

    // Send POST request to the server
    fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          const username = data.username;
          console.log(data);
          window.location.href = `/dashboard/${username}`; // Redirect to the dashboard
        } else {
          errorMessage.textContent = data.message || "Login failed. Please try again.";
          errorMessage.style.display = "block"; // Show error message
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        errorMessage.textContent = "An error occurred. Please try again.";
        errorMessage.style.display = "block"; // Show error message
      });
  });
});