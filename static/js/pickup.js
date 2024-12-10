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

let map, infoWindow, marker, userLocation;

// Initialize the map
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 12.9716, lng: 77.5946 }, // Default location (Bangalore)
    zoom: 12,
    streetViewControl: false,
    mapId: "2f25f9d08e185f62",
  });

  infoWindow = new google.maps.InfoWindow();

  const locationButton = document.createElement("button");
  locationButton.textContent = "Pan to Current Location";
  locationButton.classList.add("custom-map-control-button");
  document.querySelector('.pan-btn').appendChild(locationButton); // Add the button to the form


  locationButton.addEventListener("click", async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          // Set user's location and display the info window
          infoWindow.setPosition(pos);
          infoWindow.setContent("Location found. You can now close this box.");
          infoWindow.open(map);

          map.setCenter(pos);
          map.setZoom(13);

          if (marker) {
            marker.setMap(null);
          }
          marker = new google.maps.marker.AdvancedMarkerElement({
            position: pos,
            map: map,
            title: "Your Location",
          });

          // Save the user's location
          userLocation = pos;

          // Hide address input field when location is found
          document.getElementById("address-container").style.display = "none";
        },
        () => {
          handleLocationError(true, infoWindow, map.getCenter());
        }
      );
    } else {
      handleLocationError(false, infoWindow, map.getCenter());
    }
  });
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(
    browserHasGeolocation
      ? "Please Wait while we fetch your location."
      : "Error: Your browser doesn't support geolocation."
  );
  infoWindow.open(map);

  document.getElementById("address-container").style.display = "block";
}

async function getAddress(userLocation) {
  // If user location is available, use reverse geocoding to get the address
  const geocoder = new google.maps.Geocoder();

  return new Promise((resolve, reject) => {
    geocoder.geocode({ location: userLocation }, (results, status) => {
      if (status === "OK" && results[0]) {
        resolve(results[0].formatted_address);
      } else {
        reject("Failed to get address");
      }
    });
  });
}




async function generateAIResponse() {
  const question = "Decide the vehicle type based on these items: " + document.querySelector("#items").value;
  const responseDiv = document.querySelector("#vehicle-type");
  responseDiv.textContent = "Generating..."; // Show loading message

  try {
    // Make a POST request to the /generate-response backend
    const response = await fetch("/generate-response", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question }), // Send the question to the backend
    });

    if (response.ok) {
      const result = await response.json(); // Get the backend response
      responseDiv.textContent = result.response; // Display the AI response
    } else {
      const errorData = await response.json();
      responseDiv.textContent = `Error: ${errorData.error}`;
    }
  } catch (error) {
    console.error("Error:", error);
    responseDiv.textContent = "Failed to generate response.";
  }
}
document.querySelector("#decide-vehicle").addEventListener("click", generateAIResponse);

async function generateAIResponseForPickup() {
  const items = document.querySelector("#items");
  const priceEstimate = document.querySelector("#price-estimate");

  priceEstimate.textContent = "Processing your request...";
  const question = `Based on ${items}, give an estimate price ${priceEstimate} how much a person will get to sell these e-waste items to a recycler. Give the response in rupees`;

  try {
    // Make a POST request to the /generate-response backend
    const response = await fetch("/generate-response", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question }), // Send the question to the backend
    });

    if (response.ok) {
      const result = await response.json(); // Get the backend response
      priceEstimate.textContent = `${result.response}`; // Display the AI response
    } else {
      const errorData = await response.json();
      priceEstimate.textContent = `Error: ${errorData.error}`;
    }
  } catch (error) {
    console.error("Error:", error);
    priceEstimate.textContent = "Failed to process your request. Try Again after one minute.";
  }
}

document.querySelector("#estimate-price").addEventListener("click", generateAIResponseForPickup);

document.querySelector("#book-pickup").addEventListener("click", async () => {
  document.querySelector("#book-pickup").disabled = true;
  let address, addrlat, addrlng;

  const loadingMessage = document.createElement("h3");
  loadingMessage.textContent = "Please wait while we book your pickup...";
  loadingMessage.id = "loading-message";
  document.querySelector("#pickup-form").appendChild(loadingMessage);

  const items = document.querySelector("#items").value;
  const phno = document.querySelector("#ph-no").value;
  if (!userLocation) {
    address = document.querySelector("#address").value;
  } else {
    try {
      address = await getAddress(userLocation);  // Await the address from geocoding
      addrlat = userLocation.lat;
      addrlng = userLocation.lng;
    } catch (error) {
      alert("Error fetching address: " + error);
      document.getElementById("loading-message").remove();
      return;
    }
  }

  const landmark = document.querySelector("#landmark").value;
  const tipAmount = document.querySelector("#tip-amt").value || 0;
  const priceEstimate = document.querySelector("#price-estimate").textContent.trim();
  const vehicleType = document.querySelector("#vehicle-type").textContent.trim();

  if (!items || !phno || !landmark || !address || !priceEstimate || !vehicleType) {
    alert("Please fill all the fields.");
    document.getElementById("loading-message").remove();
    return;
  }

  // If address is manually entered, convert it to latitude and longitude
  if (!userLocation && address) {
    try {
      const geocoder = new google.maps.Geocoder();
      const results = await geocoder.geocode({ address: address });
      if (results.status === 'OK') {
        const location = results.results[0].geometry.location;
        addrlat = location.lat();
        addrlng = location.lng();
      } else {
        alert("Failed to get location from address.");
        document.getElementById("loading-message").remove();
        return;
      }
    } catch (error) {
      alert("Error converting address to coordinates: " + error);
      document.getElementById("loading-message").remove();
      return;
    }
  }

  // Prepare data to send
  const data = {
    items,
    phno,
    landmark,
    address, // Address will be sent dynamically later if geolocation is available
    tipAmount,
    addrlat,
    addrlng,
    priceEstimate,
    vechileType: vehicleType,
  };

  // Attach event listener to button
  document.querySelector("#book-pickup").onclick = generateAIResponse;

  // Send data to the backend
  sendPickupData(data);
});

// Function to send pickup data to backend
async function sendPickupData(data) {
  try {
    // Send data to the backend
    const response = await fetch("/schedule-pickup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const result = await response.json();
      document.getElementById("loading-message").remove();
      document.querySelector(".order-helper").textContent = `Your order has been confirmed. You can track the pickup using the Order ID ${result.order_id}. Contact your Delivery partner ${result.delivery_partner_name} using the number ${result.delivery_partner_contact}`;
    } else {
      alert("Failed to schedule pickup. Please try again.");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("An error occurred while scheduling the pickup.");
  } finally {
    // Remove the loading spinner or message
    document.getElementById("loading-message").remove();
  }
}
