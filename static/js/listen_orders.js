// Fetch available orders for the partner
const currentUserId = currentUser.user_id;
const currentUserName = currentUser.username;

// JavaScript to handle UI transformation
document.getElementById("fetchOrders").addEventListener("click", async function () {
  const response = await fetch("/orders");
  const ordersObj = await response.json();
  const orders = ordersObj.orders;
  console.log(orders);

  // Populate the order list with cards
  const orderList = document.getElementById("orderList");
  orderList.innerHTML = ""; // Clear previous content

  if (orders.length === 0) {
    orderList.innerHTML = "<p>No available orders</p>";
  }

  orders.forEach((order) => {
    const card = document.createElement("div");
    card.className = "order-card";

    card.innerHTML = `
      <h3>${order.items}</h3>
      <p>Order ID: ${order.order_id}</p>
      <button class="acceptOrder" data-order-id="${order.order_id}">Accept Order</button>
    `;

    // Attach click listener to the button inside the card
    card.querySelector(".acceptOrder").addEventListener("click", async (e) => {
      const orderId = e.target.dataset.orderId;
      const partnerId = currentUserId;

      try {
        const response = await fetch(`/orders/${orderId}/accept`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, partnerId }),
        });

        const result = await response.json();
        if (response.ok) {
          window.location.href = `/order_status_partner/${orderId}`;
        } else {
          alert(result.message);
        }
      } catch (error) {
        console.error("Error accepting order:", error);
      }
    });

    orderList.appendChild(card);
  });

  // Make the orders-container visible
  document.getElementById("orders-container").classList.remove("hidden");
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