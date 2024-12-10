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

document.getElementById("cards").onmousemove = e => {
  for (const card of document.getElementsByClassName("card")) {
    const rect = card.getBoundingClientRect(),
      x = e.clientX - rect.left,
      y = e.clientY - rect.top;

    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
  };
}
const sidebarItems = document.querySelectorAll('.sidebar ul li');

sidebarItems.forEach(item => {
  item.addEventListener('mousemove', e => {
    const rect = item.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    item.style.setProperty('--mouse-x', `${x}px`);
    item.style.setProperty('--mouse-y', `${y}px`);
  });

  item.addEventListener('mouseleave', () => {
    item.style.removeProperty('--mouse-x');
    item.style.removeProperty('--mouse-y');
  });
});

function progressBar() {
  let circle = document.querySelector('#svg #bar');
  let container = document.querySelector('#cont'); // Reference to the div container
  let next_mile = document.querySelector(".pts-left");
  let r = circle.getAttribute('r');
  let c = Math.PI * (r * 2); // Circumference of the circle
  const val = parseInt(current_user['weight']);
  if (val % 50 == 0)
    milestone = val + 50;
  else
    milestone = Math.ceil(val / 50) * 50;

  // Set initial values
  circle.style.strokeDasharray = c; // Total circumference
  circle.style.strokeDashoffset = c; // Start with full offset (empty bar)

  function updateProgress(val, milestone) {
    let percentage = Math.round((val / milestone) * 100); // Calculate percentage
    let pct = ((milestone - val) / milestone) * c; // Calculate stroke offset

    circle.style.strokeDashoffset = pct; // Update the offset
    container.setAttribute('data-pct', `${percentage}`);
    next_mile.textContent = milestone - val;
  }
  updateProgress(val, milestone);
}

function reward_counter() {
  document.getElementById("reward-pts").innerText = current_user['reward_pts'];
}


reward_counter();



progressBar();