document.addEventListener("DOMContentLoaded", function () {
  const resetPasswordForm = document.getElementById("resetPasswordForm");
  const errorMessage = document.getElementById("error-message");
  const successMessage = document.getElementById("success-message");

  resetPasswordForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const formData = new FormData(resetPasswordForm);
    const data = {
      token: formData.get("token"),
      password: formData.get("password"),
    };

    try {
      const response = await fetch(`/reset_password/${data.token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: data.password }),
      });

      const result = await response.json();

      if (result.status === "success") {
        successMessage.textContent = result.message;
        successMessage.style.display = "block";
        errorMessage.style.display = "none";
      } else {
        errorMessage.textContent = result.message;
        errorMessage.style.display = "block";
        successMessage.style.display = "none";
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again later.");
    }
  });
});