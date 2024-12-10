const name_container = document.getElementById('name');
const phno_container = document.getElementById('phno');
const status_container = document.getElementById('status');


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
let map, directionsService, directionsRenderer, updateInterval;

function initMap() {
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 0, lng: 0 }, // Default center
    zoom: 13,
  });
  directionsRenderer.setMap(map);

  const button = document.getElementById('track-button');
  const errorContainer = document.getElementById('error-container');
  const renderingElement = document.querySelector(".conditional-rendering");

  let updateInterval;

  button.addEventListener('click', () => {
    const id = document.querySelector("#orderID").value.trim();

    // Check if ID is provided
    if (id.length === 0) {
      errorContainer.textContent = 'Please enter a valid order ID.';
      errorContainer.classList.toggle("visible");
      renderingElement.classList.add('visible');
      return; // Exit early if ID is invalid
    }
    const error_p = document.getElementById("error-container")
    if (id.length != 0 && !error_p.classList.contains('visible')) {
      error_p.classList.add('visible');
      renderingElement.classList.add('visible');
    }

    // Fetch package location and status (whether it has been picked up) from the server
    fetch(`/get_partner_location/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
      .then((response) => response.json())
      .then((data) => {
        name_container.innerText = "Name: " + data.partnerName;
        phno_container.innerText = "Contact No: " + data.partnerContact;
        status_container.innerText = "Status :" + data.partnerStatus;

        // If package is delivered, show a message and return immediately
        if (data.isDelivered) {
          errorContainer.textContent = 'Your E-waste has been delivered';
          errorContainer.classList.remove("visible");
          return;
        }

        // If data is valid, start sending location updates every 5 seconds
        if (data.status === "success" && data.location && data.isPickedUp !== undefined) {
          const partnerLocation = data.location;
          const isPickedUp = data.isPickedUp;  // True if package picked up, false otherwise
          renderingElement.classList.toggle("visible");
          errorContainer.classList.toggle("visible");
          let destination;
          if (isPickedUp) {
            destination = data.finalDestination;  // The final destination if picked up
          } else {
            destination = { "lat": data.pickupAddress[0], "lng": data.pickupAddress[1] };  // Pickup address if not picked up
          }

          // Validate locations and ensure they're available before sending them to Google Maps
          if (partnerLocation && destination && partnerLocation.lat && partnerLocation.lng && destination.lat && destination.lng) {
            // Request route from partner location (either pickup or final destination)
            const request = {
              origin: new google.maps.LatLng(partnerLocation.lat, partnerLocation.lng),
              destination: new google.maps.LatLng(destination.lat, destination.lng),
              travelMode: google.maps.TravelMode.DRIVING,
            };

            // Fetch directions
            directionsService.route(request, (result, status) => {
              if (status === google.maps.DirectionsStatus.OK) {
                directionsRenderer.setDirections(result);
              } else {
                console.error("Error fetching directions:", status);
              }
            });
          } else {
            console.error("Invalid location or destination data");
            errorContainer.classList.toggle("visible");
          }

          // Start the interval for location updates if package is not delivered
          if (updateInterval) clearInterval(updateInterval); // Clear any existing intervals
          updateInterval = setInterval(() => {
            fetch(`/get_partner_location/${id}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              }
            })
              .then((response) => response.json())
              .then((data) => {
                if (data.isDelivered) {
                  errorContainer.textContent = 'Your E-waste has been delivered';
                  clearInterval(updateInterval);
                  return;
                }
                // Update route based on the latest location data
                const partnerLocation = data.location;
                const isPickedUp = data.isPickedUp;
                let destination;
                if (isPickedUp) {
                  destination = data.finalDestination;
                } else {
                  destination = { "lat": data.pickupAddress[0], "lng": data.pickupAddress[1] };
                }

                if (partnerLocation && destination && partnerLocation.lat && partnerLocation.lng && destination.lat && destination.lng) {
                  const request = {
                    origin: new google.maps.LatLng(partnerLocation.lat, partnerLocation.lng),
                    destination: new google.maps.LatLng(destination.lat, destination.lng),
                    travelMode: google.maps.TravelMode.DRIVING,
                  };

                  directionsService.route(request, (result, status) => {
                    if (status === google.maps.DirectionsStatus.OK) {
                      directionsRenderer.setDirections(result);
                    } else {
                      console.error("Error fetching directions:", status);
                    }
                  });
                } else {
                  console.error("Invalid location or destination data");
                }
              })
              .catch((error) => {
                console.error("Error:", error);
                errorContainer.textContent = 'An error occurred while fetching the data.';
                errorContainer.classList.toggle("visible");
              });
          }, 5000000000000);
        } else {
          errorContainer.textContent = 'Check your Order ID.';
          errorContainer.classList.toggle("visible");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        errorContainer.textContent = 'An error occurred while fetching the data.';
        errorContainer.classList.toggle("visible");
      });
  });
}


