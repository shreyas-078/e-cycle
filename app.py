from flask import Flask, request, jsonify, render_template, url_for, redirect
from flask_login import (
    LoginManager,
    UserMixin,
    login_user,
    login_required,
    logout_user,
    current_user,
)
import motor.motor_asyncio
import asyncio
from pymongo import MongoClient
import os
from bson import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
import datetime
import dotenv
import certifi
import datetime
import jwt
from flask_mail import Mail, Message
from predict_vechicle import get_gemini_response

dotenv.load_dotenv()

client = motor.motor_asyncio.AsyncIOMotorClient(os.getenv("MONGO_URI"))
app = Flask(__name__, static_folder="static", static_url_path="/static")

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"

client = MongoClient(
    os.getenv("MONGO_URI"), tlscafile=certifi.where(), tlsAllowInvalidCertificates=True
)
db = client["E-Cycle"]
orders_collection = db["orders"]
credentials = db["credentials"]
app.secret_key = os.getenv("SECRET_KEY")

# Flask-Mail configuration
app.config["MAIL_SERVER"] = "smtp.gmail.com"
app.config["MAIL_PORT"] = 587
app.config["MAIL_USE_TLS"] = True
app.config["MAIL_USERNAME"] = os.getenv("MAIL_USERNAME")
app.config["MAIL_PASSWORD"] = os.getenv("MAIL_PASSWORD")

mail = Mail(app)


class User(UserMixin):
    def __init__(self, user_id, username, email, phno, role, reward_pts, weight):
        self.user_id = user_id
        self.username = username
        self.email = email
        self.phno = phno
        self.role = role
        self.reward_pts = reward_pts
        self.weight = weight

    def get_id(self):
        return self.user_id


@login_manager.user_loader
def load_user(user_id):
    user = credentials.find_one({"_id": ObjectId(user_id)})

    if user:
        return User(
            user_id=str(user["_id"]),
            username=user["username"],
            email=user["email"],
            phno=user["phno"],
            role=user["role"],
            reward_pts=user["reward_pts"],
            weight=user["weight"],
        )
    else:
        return None


@login_manager.unauthorized_handler
def unauthorized():
    return render_template("access_denied.html"), 401


@app.after_request
def add_no_cache_headers(response):
    response.headers["Cache-Control"] = (
        "no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0"
    )
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


# Monitor the order status and wait until a delivery partner is assigned
async def monitor_order_for_delivery_partner(order_id):
    """Asynchronously check if a delivery partner has been assigned."""
    while True:
        order = db.orders.find_one({"order_id": order_id})

        # Check if a delivery partner is assigned to the order
        if (
            order
            and "delivery_partner_name" in order
            and "delivery_partner_contact" in order
        ):
            return order["delivery_partner_name"], order["delivery_partner_contact"]

        await asyncio.sleep(1)  # Check every 1 second


# This is where the order is initially placed by the user, and we assign a delivery partner
@app.route("/schedule-pickup", methods=["POST"])
@login_required
async def schedule_pickup():
    data = request.get_json()

    # Generate a new unique order_id for this order
    order_id = str(ObjectId())

    data["order_id"] = order_id
    data["addresslatlng"] = {"lat": data["addrlat"], "lng": data["addrlng"]}
    data["status"] = "pending"  # Ensure the order starts with the status "pending"
    data["destination"] = {"lat": 12.9938812, "lng": 77.5412264}
    data["user_id"] = str(current_user.user_id)

    db.orders.insert_one(data)

    # Monitor the order until a delivery partner is assigned
    partner_name, partner_phno = await monitor_order_for_delivery_partner(order_id)

    return jsonify(
        {
            "message": "Order placed successfully",
            "order_id": order_id,
            "delivery_partner_name": partner_name,
            "delivery_partner_contact": partner_phno,
        }
    )


@app.route("/listen_orders", methods=["GET"])
@login_required
def listen_orders():
    return render_template("listen_orders.html")


# Convert MongoDB ObjectId and other non-serializable fields to JSON-compatible format.
def serialize_order(order):
    if "_id" in order:
        order["_id"] = str(order["_id"])
    return order


# This will be called on the delivery partner's app to get nearby orders
@app.route("/orders", methods=["GET"])
@login_required
def get_orders():
    # Fetch pending orders
    orders = list(db.orders.find({"status": "pending"}))
    serialized_orders = [serialize_order(order) for order in orders]
    return jsonify({"orders": serialized_orders})


@app.route("/order_status_partner/<orderid>")
@login_required
def order_help(orderid):
    query = db.orders.find_one({"order_id": orderid})
    if query["status"] == "delivered":
        return "<h1>This Order has already been delivered</h1>"
    return render_template(
        "order_status_partner.html", orderid=orderid, items=query["items"]
    )


# This route will be used by the delivery partner to accept an order
@app.route("/orders/<order_id>/accept", methods=["POST"])
@login_required
def accept_order(order_id):
    data = request.get_json()
    delivery_partner_id = data.get("partnerId")

    # Fetch the delivery partner's details from the database
    delivery_partner = db.credentials.find_one({"_id": ObjectId(delivery_partner_id)})
    if delivery_partner:
        delivery_partner_name = delivery_partner["username"]
        delivery_partner_contact = delivery_partner["phno"]

    if not delivery_partner:
        return jsonify({"message": "Delivery partner not found"}), 404

    # Update the order document with the delivery partner's details
    result = db.orders.update_one(
        {"order_id": order_id, "status": "pending"},
        {
            "$set": {
                "status": "assigned",
                "delivery_partner_id": delivery_partner_id,
                "delivery_partner_name": delivery_partner_name,  # Save the name
                "delivery_partner_contact": delivery_partner_contact,  # Save the contact number
            }
        },
    )

    if result.modified_count == 1:
        return jsonify(
            {
                "message": "Order accepted",
                "delivery_partner_name": delivery_partner_name,
                "delivery_partner_contact": delivery_partner_contact,
                "order_id": order_id,
            }
        )
    else:
        return jsonify({"message": "Order not found or already assigned"}), 400


# This route will be used by the user to get the delivery partner information
@app.route("/get_delivery_partner/<order_id>", methods=["GET"])
@login_required
def get_delivery_partner(order_id):
    # Fetch the order to get delivery partner details
    order = db.orders.find_one({"_id": ObjectId(order_id)})

    if (
        order
        and "delivery_partner_name" in order
        and "delivery_partner_contact" in order
    ):
        return jsonify(
            {
                "delivery_partner_name": order["delivery_partner_name"],
                "delivery_partner_contact": order["delivery_partner_contact"],
            }
        )
    else:
        return jsonify({"message": "No delivery partner assigned to this order."}), 404


@app.route("/update-location/<orderId>", methods=["POST"])
@login_required
def update_location(orderId):
    data = request.get_json()
    location = data.get("location")

    # Update the delivery partner's current location in the order document
    db.orders.update_one(
        {"order_id": orderId},
        {"$set": {"current_location": location}},
    )

    return jsonify({"message": "Location updated successfully"})


@app.route("/orders/<order_id>/picked_up", methods=["GET"])
@login_required
def mark_picked_up(order_id):
    db.orders.update_one(
        {"order_id": order_id, "status": "assigned"}, {"$set": {"status": "picked_up"}}
    )
    return jsonify({"message": "Order marked as picked up"})


@app.route("/orders/<order_id>/delivered", methods=["GET"])
def mark_delivered(order_id):

    query = db.orders.find_one({"order_id": order_id})
    estimate = query["priceEstimate"]
    user_id = query["user_id"]
    curr_points = db.credentials.find_one({"_id": ObjectId(user_id)})
    reward_pts = float(curr_points["reward_pts"])  # Convert to float
    points = int(reward_pts + (0.05 * float(estimate)))

    db.orders.update_one(
        {"order_id": order_id, "status": "picked_up"}, {"$set": {"status": "delivered"}}
    )
    db.credentials.update_one(
        {"_id": ObjectId(user_id)}, {"$set": {"reward_pts": points}}
    )

    db.credentials.update_one(
        {"_id": ObjectId(user_id)}, {"$set": {"weight": curr_points["weight"] + 1}}
    )
    return jsonify({"message": "Order marked as delivered"})


@app.route("/", methods=["GET"])
def landing():
    return render_template("landing.html")


@app.errorhandler(404)
def page_not_found(e):
    return render_template("404.html"), 404


@app.route("/login", methods=["GET"])
def login():
    return render_template("login.html")


@app.route("/login", methods=["POST"])
def login_post():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    login_as = data.get("login_as")

    # Find user in the credentials database based on username and role
    user = credentials.find_one({"username": username, "role": login_as})

    if user and check_password_hash(user["password"], password):
        # If credentials are valid, create a User object and log in the user
        user_obj = User(
            user_id=str(user["_id"]),
            username=user["username"],
            email=user["email"],
            phno=user["phno"],
            role=user["role"],
            reward_pts=user["reward_pts"],
            weight=user["weight"],
        )
        login_user(user_obj)

        if login_as == "User":
            return (
                jsonify(
                    {
                        "status": "success",
                        "type": "user",
                        "user_id": current_user.user_id,
                        "username": current_user.username,
                        "role": current_user.role,
                    }
                ),
                200,
            )
        elif login_as == "Delivery Partner":
            return (
                jsonify(
                    {
                        "status": "success",
                        "type": "delivery_partner",
                        "user_id": current_user.user_id,
                        "username": current_user.username,
                        "role": current_user.role,
                    }
                ),
                200,
            )
        else:
            return (
                jsonify({"status": "error", "message": "Invalid role specified"}),
                400,
            )
    else:
        # If login fails, return an error message
        return (
            jsonify({"status": "error", "message": "Invalid username or password"}),
            401,
        )


@app.route("/register", methods=["GET"])
def register():
    return render_template("register.html")


@app.route("/signup-complete", methods=["GET"])
def signup_complete():
    return render_template("signup_complete.html")


@app.route("/register", methods=["POST"])
def register_post():
    data = request.get_json()
    username = data.get("username")
    email = data.get("email")
    phno = data.get("phno")
    password = data.get("password")
    role = data.get("role")
    reward_pts = 0
    weight = 0

    # Check if the username already exists
    if credentials.find_one({"username": username}):
        return (
            jsonify({"status": "error", "message": "Username is already taken."}),
            400,
        )

    # Check if the email already exists with the same role
    existing_user_email = credentials.find_one({"email": email})
    if existing_user_email:
        if existing_user_email["role"] == role:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Email is already registered with the same role.",
                    }
                ),
                400,
            )

    # Check if the phone number already exists with the same role
    existing_user_phno = credentials.find_one({"phno": phno})
    if existing_user_phno:
        if existing_user_phno["role"] == role:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Phone number is already registered with the same role.",
                    }
                ),
                400,
            )

    # Hash the password before storing it in the database
    hashed_password = generate_password_hash(password)

    # Insert the user's credentials into the database
    credentials.insert_one(
        {
            "username": username,
            "email": email,
            "phno": phno,
            "password": hashed_password,
            "role": role,
            "reward_pts": reward_pts,
            "weight": weight,
        }
    )

    return jsonify({"status": "success", "message": "User registered successfully."})


@app.route("/forgot_password", methods=["POST"])
def handle_forgot_password():
    data = request.get_json()
    email = data.get("email")
    user = credentials.find_one({"email": email})
    if user:
        token = jwt.encode(
            {
                "email": email,
                "exp": datetime.datetime.now(datetime.timezone.utc)
                + datetime.timedelta(hours=1),
            },
            app.config["SECRET_KEY"],
        )
        reset_link = url_for("reset_password_page", token=token, _external=True)
        msg = Message(
            "Password Reset Request",
            sender=os.getenv("MAIL_USERNAME"),
            recipients=[email],
        )
        msg.body = f"Please click the link to reset your password: {reset_link}"
        mail.send(msg)
        return jsonify(
            {
                "status": "success",
                "message": "Please check you email for instructions to reset your password.",
            }
        )
    else:
        return jsonify(
            {"status": "error", "message": "Could not find an account with this email."}
        )


@app.route("/reset_password/<token>", methods=["GET", "POST"])
def reset_password_page(token):
    try:
        data = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
        email = data["email"]
    except jwt.ExpiredSignatureError:
        return jsonify({"status": "error", "message": "The reset link has expired."})
    except jwt.InvalidTokenError:
        return jsonify({"status": "error", "message": "Invalid reset link."})

    if request.method == "POST":
        new_password = request.get_json().get("password")
        hashed_password = generate_password_hash(new_password)
        credentials.update_one(
            {"email": email}, {"$set": {"password": hashed_password}}
        )
        return jsonify(
            {"status": "success", "message": "Password has been reset successfully."}
        )
    else:
        return render_template("reset_password.html", token=token)


@app.route("/get_partner_location/<order_id>", methods=["GET"])
def get_partner_location(order_id):
    # Retrieve the partner's order information from the database using the partner_id
    partner = db.orders.find_one({"order_id": order_id})
    print(order_id)

    # Check if partner data exists and contains the required fields
    if partner:
        response = {
            "status": "success",
            "partnerStatus": "Picked Up",
            "partnerName": partner["delivery_partner_name"],
            "partnerContact": partner["delivery_partner_contact"],
            "isDelivered": True if partner["status"] == "delivered" else False,
            "location": partner.get(
                "current_location", {}
            ),  # Current location of the partner
            "isPickedUp": (
                True if partner["status"] == "picked_up" else False
            ),  # If the package has been picked up
            "pickupAddress": [
                partner.get("addrlat"),
                partner.get("addrlng"),
            ],  # Address where the partner will pick up the package
            "finalDestination": partner.get(
                "destination", {}
            ),  # Final destination if the package has been picked up
        }

        # Return the response as JSON
        return jsonify(response)

    return jsonify({"status": "error", "message": "Partner not found"}), 404


# Fetch the route and delivery partner's current location for tracking.
@app.route("/get-route/<order_id>", methods=["GET"])
def get_route(order_id):
    order = db.orders.find_one({"order_id": order_id})
    if not order:
        return jsonify({"message": "Order not found."}), 404

    # Get partner location
    partner_location = order.get("current_location")
    if not partner_location:
        return jsonify({"message": "Partner location not available yet."}), 404

    # Check if the order is picked up
    if order.get("status") == "picked_up":
        destination = order.get("destination")
    else:
        destination = order.get("addresslatlng")

    # Return current location and destination
    return jsonify(
        {
            "partner_location": partner_location,
            "destination": destination,
        }
    )


@app.route("/forgot_password_page", methods=["GET"])
def forgot_password_page():
    return render_template("forgot_password.html")


@app.route("/recycle-centres", methods=["GET"])
@login_required
def recycle():
    return render_template("recycle-centres.html")


@app.route("/pickup", methods=["GET"])
@login_required
def pickup():
    return render_template("pickup.html")


@app.route("/dashboard/<username>", methods=["GET"])
@login_required
def user(username):
    # Ensure the current user is accessing their own messages
    if current_user.username != username:
        return render_template("access_denied.html")
    return render_template(
        "dashboard.html",
        username=username,
        user_id=current_user.user_id,
        role=current_user.role,
    )


@app.route("/logout", methods=["GET"])
def logout_user_custom():
    logout_user()
    return redirect(url_for("landing"))


@app.route("/track-pickup", methods=["GET"])
@login_required
def track_pickup():
    return render_template("track_pickup.html")


@app.route("/rewards")
@login_required
def rewards():
    if current_user.role == "User":
        return render_template("rewards.html")
    return "<h1>Access Denied</h1>"


@app.route("/analytics")
@login_required
def analytics():
    return render_template("analytics.html")


@app.route("/support", methods=["GET"])
@login_required
def support():
    return render_template("support.html")


@app.route("/history", methods=["GET"])
@login_required
def history():
    return render_template("history.html")


@app.route("/history/<user_id>", methods=["POST"])
@login_required
def get_history(user_id):
    # Query to filter entries with status 'delivered'
    query = {"status": "delivered", "user_id": user_id}
    query_for_delivery_partner = {"status": "delivered", "delivery_partner_id": user_id}

    # Check the role of the current user
    if current_user.role == "Delivery Partner":
        projection = {
            "user_id": 1,
            "items": 1,
            "phno": 1,
            "priceEstimate": 1,
            "tipAmount": 1,
            "order_id": 1,
            "_id": 0,  # Exclude the _id field
        }
    else:
        projection = {
            "user_id": 1,
            "items": 1,
            "phno": 1,
            "priceEstimate": 1,
            "vechileType": 1,
            "order_id": 1,
            "delivery_partner_contact": 1,
            "delivery_partner_name": 1,
            "_id": 0,  # Exclude the _id field
        }

    # Fetch the results
    if current_user.role == "Delivery Partner":
        delivered_orders = list(
            orders_collection.find(query_for_delivery_partner, projection)
        )
    else:
        delivered_orders = list(orders_collection.find(query, projection))

    # Return the results as JSON
    return jsonify({"delivered_orders": delivered_orders})


@app.route("/generate-response", methods=["POST"])
def generate_response():
    # Get the data from the frontend
    data = request.json
    question = data.get("question")

    if not question:
        return jsonify({"error": "Question is required"}), 400

    try:
        # Call the predict_model function
        response = get_gemini_response(question)
        return jsonify({"response": response})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=23001)
