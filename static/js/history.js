const coords = { x: 0, y: 0 };
const circles = document.querySelectorAll(".circle");
const ordersContainer = document.querySelector(".history-container");

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
async function history() {
  try {
    // Fetch the order history data from the backend
    const response = await fetch(`/history/${current_user["user_id"]}`, {
      method: 'POST',  // Change the method to POST
      headers: {
        'Content-Type': 'application/json',  // Indicate that you're sending JSON
      }
    });

    // Check if the response is successful (status 200)
    if (!response.ok) {
      throw new Error('Failed to fetch the data');
    }

    // Parse the JSON response
    const data = await response.json();
    const deliveredOrders = data.delivered_orders;
    console.log(data);


    // Check if there are delivered orders
    if (deliveredOrders.length > 0) {
      // Loop through each delivered order and create a div for each one
      deliveredOrders.forEach(order => {
        const orderDiv = document.createElement("div");
        orderDiv.classList.add("history-card");
        if (!order["delivery_partner_name"]) {
          orderDiv.innerHTML = `
                <h3>Order ID: ${order.order_id}</h3>
                <p><strong>Items:</strong> ${order.items}</p>
                <p><strong>Phone Number:</strong> ${order.phno}</p>
                <p><strong>Price:</strong> ${order.priceEstimate}</p>
                <p><strong>Tip Amount:</strong> ${order.tipAmount}</p>
            `;
        } else {
          orderDiv.innerHTML = `
                <h3>Order ID: ${order.order_id}</h3>
                <p><strong>Items:</strong> ${order.items}</p>
                <p><strong>Phone Number:</strong> ${order.phno}</p>
                <p><strong>Price:</strong> ${order.priceEstimate}</p>
                <p><strong>Delivery Partner:</strong> ${order.delivery_partner_name}</p>
                <p><strong>Delivery Partner Name:</strong> ${order.delivery_partner_name}</p>
                <p><strong>Delivery Partner Contact:</strong> ${order.delivery_partner_contact}</p>
            `;
        }

        orderDiv.style.fontSize = '1.3rem';
        if (order.role == 'Delivery Partner') {

          const tip = document.createElement("p");
          tip.textContent = order.tipAmount;
          orderDiv.append(tip);
        }
        ordersContainer.appendChild(orderDiv);
      });
    } else {
      // If no orders, display a message
      if (current_user['role'] == 'Delivery Partner')
        ordersContainer.innerHTML = "<p>No fullfilled orders found.</p>";
      else
        ordersContainer.innerHTML = "<p>No delivered orders found.</p>";
      ordersContainer.classList.add('modified-history-container');
    }
  } catch (error) {
    console.error('Error fetching the order history:', error);
    ordersContainer.innerHTML = "<p>Failed to load order history. Please try again later.</p>";
  }
}

history();