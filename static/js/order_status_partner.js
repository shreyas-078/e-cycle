const orderId = userorderId["orderId"];

let app = {
  map: null,
  directionsService: null,
  directionsRenderer: null,

  // Initialize the map and Google Maps services
  initMap() {
    this.map = new google.maps.Map(document.getElementById("map"), {
      center: { lat: 0, lng: 0 }, // Default center; adjust if needed
      zoom: 13,
    });

    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer();
    this.directionsRenderer.setMap(this.map);

    // Start location updates (sending location every 2 seconds)
    this.startLocationUpdates();
  },

  // Start sending the user's location every 2 seconds
  startLocationUpdates() {
    setInterval(() => this.updatePartnerLocation(), 2000); // Send location every 2 seconds
  },

  // Update the partner's location and send it to the server
  async updatePartnerLocation() {
    try {
      const position = await this.getCurrentPosition();
      const currentLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      // Send location to the server
      await fetch(`/update-location/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ "location": currentLocation }),
      });

      // Fetch and update the route
      this.fetchRoute();
    } catch (error) {
      console.error("Error updating location:", error);
    }
  },

  // Fetch route to user/destination
  async fetchRoute() {
    try {
      const response = await fetch(`/get-route/${orderId}`);
      const data = await response.json();
      if (data.error) {
        console.error(data.error);
        return;
      }

      const { partner_location, destination } = data;


      if (partner_location && destination) {
        const request = {
          origin: new google.maps.LatLng(partner_location.lat, partner_location.lng),
          destination: new google.maps.LatLng(destination.lat, destination.lng),
          travelMode: google.maps.TravelMode.DRIVING,
        };

        this.directionsService.route(request, (result, status) => {
          if (status === google.maps.DirectionsStatus.OK) {
            this.directionsRenderer.setDirections(result);
          } else {
            console.error("Error fetching directions:", status);
          }
        });

        // Update or create destination marker
      }
    } catch (error) {
      console.error("Error fetching route:", error);
    }
  },

  // Get current geolocation
  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        (error) => reject(`Geolocation error: ${error.message}`),
        { enableHighAccuracy: true }
      );
    });
  },
};

// Initialize the app when the Google Maps script loads
window.initMap = () => app.initMap();

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

async function markPickup() {
  const response = await fetch(`/orders/${userorderId.orderId}/picked_up`);
  alert("Order marked as picked up.");
  console.log(response.json());
}

async function markDelivered() {
  const response = await fetch(`/orders/${userorderId.orderId}/delivered`);
  const data = await response.json();
  if (data.message === "Order marked as delivered") {
    alert("Order marked as delivered");
    window.location.href = "/listen_orders";
  }
}
