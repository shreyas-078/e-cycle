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
  const form = document.getElementById("loginForm");

  let selectedRole = ""; // Variable to store the selected role

  // Handle dropdown menu toggle
  dropdownButton.addEventListener("click", () => {
    dropdownMenu.classList.toggle("show");
  });

  // Handle dropdown item selection
  dropdownMenu.querySelectorAll(".dropdown-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      selectedRole = e.target.dataset.value;
      dropdownButton.textContent = selectedRole + " ▼"; // Update button text
      dropdownMenu.classList.remove("show"); // Hide dropdown
    });
  });

  // Handle form submission
  form.addEventListener("submit", (e) => {
    e.preventDefault(); // Prevent the default form submission behavior

    // Clear previous error messages
    clearErrorMessages();

    // Get form field values
    const email = document.getElementById("email").value.trim();
    const username = document.getElementById("username").value.trim();
    const phno = document.getElementById("phno").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    let errors = []; // Array to accumulate errors

    // Validate required fields
    if (!selectedRole) {
      errors.push("Please select a role.");
    }

    if (password !== confirmPassword) {
      errors.push("Passwords do not match.");
    }

    if (phno.length !== 10 || isNaN(phno)) {
      errors.push("Phone number must be a 10-digit number.");
    }

    // If errors exist, show them
    if (errors.length > 0) {
      showError(errors);
      return;
    }

    // Create data object to send
    const data = {
      email,
      username,
      phno,
      password,
      role: selectedRole,
    };

    // Send data to the server via fetch
    fetch("/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((result) => {
        if (result.status === "success") {
          showError([result.message]); // Show success message or success state
          window.location.href = "/signup-complete"; // Redirect to login page
        } else {
          showError([result.message || "Unknown error."]);
        }
      })
      .catch((error) => {
        console.error("Error during registration:", error);
        showError(["An error occurred during registration. Please try again later."]);
      });
  });

  // Function to show error messages
  function showError(errors) {
    const errorElement = document.getElementById("form-helper");
    errorElement.textContent = errors.join(" "); // Join errors with space, or use a separator like line breaks
    errorElement.style.color = "red"; // Highlight the error message in red
  }

  // Function to clear previous error messages
  function clearErrorMessages() {
    const errorElement = document.getElementById("form-helper");
    errorElement.textContent = ""; // Clear text content
    errorElement.style.color = ""; // Reset color
  }

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!dropdownButton.contains(e.target) && !dropdownMenu.contains(e.target)) {
      dropdownMenu.classList.remove("show");
    }
  });
});





