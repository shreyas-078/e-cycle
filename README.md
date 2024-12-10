# E-Cycle

This project is Our "SeaMr" Team's Submission for the CMRIT Vyuhatech 2024 National Level Hackathon.

Our team won the 2nd Consolation prize (5th Place) out of 45 teams across India with a cash prize of Rs. 2500 for the team!

E-Cycle is an innovative platform designed to offer e waste pickup services at your doorstep while offering rewards to users. The backend is built with Flask, MongoDB, flask-login to handle user authentication, order management, and delivery partner coordination seamlessly. The frontend is built with HTML, CSS & JS.

# Contributors

- Shreyas Salankimatt
- Ashray Chaitanya
- Akshat Rai
- Pranav S Devang

## Features

- **User Management**:

  - Registration and login with role-based access control (User or Delivery Partner).
  - Password reset functionality with email verification.
  - User authentication via `Flask-Login`.

- **Order Management**:

  - Users can schedule pickups for recyclable items.
  - Real-time tracking of delivery partners' location.
  - Automated reward system for delivered items.
  - Delivery partners can view and accept pending orders.

- **Integration**:

  - MongoDB integration using `motor` for asynchronous operations.
  - Email notifications for password reset using `Flask-Mail`.

- **Data Visualization**:

  - Dashboards for users to view history and rewards.
  - Analytics page for tracking progress and impact.

- **Security**:
  - Secure password storage with hashing using `Werkzeug`.
  - JWT-based password reset tokens.

## Technology Stack

- **Backend Framework**: Flask
- **Database**: MongoDB (asynchronous with Motor)
- **Authentication**: Flask-Login, JWT
- **Email**: Flask-Mail
- **Frontend**: HTML templates rendered by Flask (integration with JavaScript and CSS)
- **Others**:
  - Asynchronous background tasks with `asyncio`.
  - RESTful APIs for communication between components.

## Prerequisites

- Python 3.8 or higher
- MongoDB server running
- Environment variables set in a `.env` file

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/shreyas-078/e-cycle.git
   cd e-cycle
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file in the root directory and add the following keys:

   ```env
   SECRET_KEY=your_secret_key
   MONGO_URI=your_mongo_connection_uri
   MAIL_USERNAME=your_email_address
   MAIL_PASSWORD=your_email_password
   API_KEY_GEMINI=your_gemini_api_key
   ```

4. Run the application:
   ```bash
   python app.py
   ```

## API Endpoints

### Authentication

- **POST** `/login`: User login.
- **POST** `/register`: User registration.
- **POST** `/forgot_password`: Initiate password reset.
- **POST** `/reset_password/<token>`: Reset password using token.

### User

- **POST** `/schedule-pickup`: Schedule a recycling pickup.
- **GET** `/get_delivery_partner/<order_id>`: Get delivery partner information for an order.
- **GET** `/dashboard/<username>`: Access user dashboard.

### Delivery Partner

- **GET** `/orders`: View pending orders.
- **POST** `/orders/<order_id>/accept`: Accept an order.
- **POST** `/update-location/<orderId>`: Update location of the delivery partner.
- **GET** `/orders/<order_id>/picked_up`: Mark an order as picked up.
- **GET** `/orders/<order_id>/delivered`: Mark an order as delivered.

## Directory Structure

```
E-Cycle/
├── static/               # Static files (CSS, JS, images)
├── templates/            # HTML templates
├── app.py                # Main application file
├── requirements.txt      # Python dependencies
├── .env                  # Environment variables (not included in repo)
├── predict_vehicle.py    # Gemini API for Vehicle Type Prediction
└── README.md             # Project documentation
```

## Future Enhancements

- Responsive Website
- Integration with payment gateways.
- Enhanced analytics and visualization tools.
- Mobile application support.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Happy Recycling! 🌱
