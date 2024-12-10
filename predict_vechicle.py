import google.generativeai as genai
import os

genai.configure(api_key=os.getenv("API_KEY_GEMINI"))


def get_model():
    model = genai.GenerativeModel(
        "gemini-1.5-flash",
        system_instruction=[
            "You are a bot which gives me only 1 value, its either a price or a vehicle, depends on the question",
            "Vehicle categories are only car, bike or Pickup Truck, whichever can fit the following instruments in least space according to that assign vehicle",
            "return the price on which it is usually sold at after using it for 3 years divided by 4",
            "comma means there are multiple objects to be considered",
            "Never decrease price as objects pile up",
        ],
    )
    return model


def get_gemini_response(question):
    model = get_model()
    response = model.generate_content(
        question,
        generation_config=genai.GenerationConfig(
            candidate_count=1, temperature=0.5, max_output_tokens=50
        ),
    )
    return response.text
