from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import pandas as pd
import numpy as np
import logging
import json
from datetime import datetime, timedelta
import random
import google.generativeai as genai
import re
import googlemaps
from googlemaps.exceptions import ApiError

app = Flask(__name__)

# Enable CORS for all routes
CORS(app, resources={r"/*": {"origins": "*"}})

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Hardcoded Google Maps API key (replace with your actual key)
GOOGLE_MAPS_API_KEY = "AIzaSyB3ck6Q8UxdVqKNL6uKaQjwUtoLbw3fh3c"

# Initialize Google Maps client
try:
    gmaps = googlemaps.Client(key=GOOGLE_MAPS_API_KEY)
    logger.info("Google Maps API configured successfully")
except Exception as e:
    logger.error(f"Failed to configure Google Maps API: {str(e)}")
    raise

# Cache for doctor search results (location, radius) -> (results, timestamp)
doctors_cache = {}

# Cache for recommended exercises (user_id -> list of recommended exercises)
recommended_exercises_cache = {}

# Doctor search endpoint
@app.route('/doctors/search', methods=['GET'])
def search_doctors():
    try:
        location = request.args.get('location', '')
        radius = int(request.args.get('radius', 5000))  # Default 5km radius
        user_id = request.args.get('userId', DEFAULT_USER_ID)
        
        if not location:
            logger.error("Location is required for doctor search")
            return jsonify({"error": "Location is required"}), 400

        # Check cache
        cache_key = f"{location.lower()}:{radius}"
        if cache_key in doctors_cache:
            cached_data, timestamp = doctors_cache[cache_key]
            if datetime.now() - timestamp < timedelta(hours=24):
                logger.info(f"Returning cached results for {cache_key}")
                return jsonify(cached_data)

        # Geocode the location to get latitude and longitude
        geocode_result = gmaps.geocode(location)
        if not geocode_result:
            logger.error(f"No geocode results for location: {location}")
            return jsonify({"error": "Invalid location"}), 400

        lat_lng = geocode_result[0]['geometry']['location']
        logger.debug(f"Geocoded location {location} to {lat_lng}")

        # Search for doctors using Places API
        places_result = gmaps.places(
            query="endocrinologist OR diabetologist",
            location=(lat_lng['lat'], lat_lng['lng']),
            radius=radius,
            type='doctor'
        )

        doctors = []
        for place in places_result.get('results', [])[:3]:  # Limit to 3 doctors to reduce costs
            # Fetch detailed information for each doctor
            place_details = gmaps.place(place['place_id'], fields=[
                'name', 'formatted_address', 'rating', 'user_ratings_total', 'reviews', 'formatted_phone_number', 'website'
            ])

            if place_details.get('status') != 'OK':
                logger.warning(f"Failed to fetch details for place ID: {place['place_id']}")
                continue

            details = place_details['result']
            # Heuristic for experience: Estimate based on review count and rating
            experience_estimate = "Unknown"
            review_count = details.get('user_ratings_total', 0)
            if review_count > 50:
                experience_estimate = "Likely experienced (based on high review count)"
            elif details.get('rating', 0) > 4.0:
                experience_estimate = "Possibly experienced (based on high rating)"

            doctor = {
                'name': details.get('name', 'Unknown'),
                'address': details.get('formatted_address', 'Unknown'),
                'rating': details.get('rating', 0.0),
                'total_reviews': review_count,
                'experience': experience_estimate,
                'phone': details.get('formatted_phone_number', 'Not available'),
                'website': details.get('website', 'Not available'),
                'reviews': [
                    {
                        'author': review.get('author_name', 'Anonymous'),
                        'rating': review.get('rating', 0),
                        'text': review.get('text', ''),
                        'time': review.get('relative_time_description', '')
                    }
                    for review in details.get('reviews', [])[:3]
                ]
            }
            doctors.append(doctor)

        if not doctors:
            logger.info(f"No doctors found for location: {location}")
            return jsonify({"error": "No diabetes specialists found in this area"}), 404

        # Cache the results
        result_data = {
            'doctors': doctors,
            'location': location,
            'radius': radius
        }
        doctors_cache[cache_key] = (result_data, datetime.now())
        logger.info(f"Cached results for {cache_key}")

        logger.info(f"Found {len(doctors)} doctors for location: {location}")
        return jsonify(result_data)

    except ApiError as e:
        logger.error(f"Google Maps API error: {str(e)}")
        return jsonify({"error": f"Google Maps API error: {str(e)}"}), 500
    except Exception as e:
        logger.error(f"Error in search_doctors: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

# Hardcoded Gemini API key
GEMINI_API_KEY = "AIzaSyBWVhpheEDlakzInmo78_jF_imwx1Y8asA"

# Configure Gemini API
try:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-1.5-flash')
    logger.info("Gemini API configured successfully")
except Exception as e:
    logger.error(f"Failed to configure Gemini API: {str(e)}")
    raise

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, PolynomialFeatures
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from xgboost import XGBClassifier
from imblearn.ensemble import BalancedBaggingClassifier
from imblearn.over_sampling import SMOTE
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, precision_recall_curve, accuracy_score

# Load and prepare the dataset for diabetes prediction
try:
    url = "https://raw.githubusercontent.com/jbrownlee/Datasets/master/pima-indians-diabetes.data.csv"
    names = ['Pregnancies', 'Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI', 'DiabetesPedigreeFunction', 'Age', 'Outcome']
    data = pd.read_csv(url, names=names)
    logger.info("Dataset loaded successfully")
except Exception as e:
    logger.error(f"Failed to load dataset: {str(e)}")
    raise

# Handle zero values in critical features
columns_with_zeros = ['Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI']
data[columns_with_zeros] = data[columns_with_zeros].replace(0, np.nan)
data[columns_with_zeros] = data[columns_with_zeros].fillna(data[columns_with_zeros].median())
logger.info("Zero values replaced with median")

# Add features: Capped Glucose-to-Insulin ratio and BMI Category
data['Glucose_Insulin_Ratio'] = data['Glucose'] / (data['Insulin'] + 1e-6)
data['Glucose_Insulin_Ratio'] = data['Glucose_Insulin_Ratio'].clip(upper=data['Glucose_Insulin_Ratio'].quantile(0.95))  # Cap extreme values
data['BMI_Category'] = pd.cut(data['BMI'], bins=[0, 18.5, 25, 30, 100], labels=[0, 1, 2, 3])  # Underweight, Normal, Overweight, Obese
data['BMI_Category'] = data['BMI_Category'].astype(int)  # Convert to numeric
logger.info("Added capped Glucose_Insulin_Ratio and BMI_Category features")

# Features and target (drop Insulin to reduce noise)
X = data.drop(['Outcome', 'Insulin'], axis=1)
y = data['Outcome']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Scale the features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Train the Stacking Classifier
from sklearn.ensemble import StackingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import cross_val_score

# Define base models with class weighting and tuned parameters
base_models = [
    ('rf', RandomForestClassifier(n_estimators=300, max_depth=8, min_samples_split=5, min_samples_leaf=2, class_weight='balanced', random_state=42)),
    ('xgb', XGBClassifier(n_estimators=200, learning_rate=0.05, max_depth=3, min_child_weight=3, scale_pos_weight=1.3*sum(y_train==0)/sum(y_train==1), eval_metric='logloss', random_state=42))
]

# Define meta-model
meta_model = LogisticRegression()

# Initialize and train Stacking Classifier
model = StackingClassifier(estimators=base_models, final_estimator=meta_model, cv=5)
model.fit(X_train_scaled, y_train)

# Evaluate cross-validation accuracy
cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5, scoring='accuracy')
logger.info(f"Cross-validation accuracy: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

# Evaluate accuracy and detailed metrics on test set
y_pred = model.predict(X_test_scaled)
test_accuracy = accuracy_score(y_test, y_pred)
logger.info(f"Stacking Classifier trained successfully. Test set accuracy: {test_accuracy:.4f}")
logger.info(f"Classification Report:\n{classification_report(y_test, y_pred)}")

# Log feature importance from Random Forest
rf_model = model.named_estimators_['rf']
feature_names = X.columns
importances = rf_model.feature_importances_
logger.info(f"Random Forest Feature Importance: {dict(zip(feature_names, importances))}")


# Static exercise data for fallback
exercises = [
    {
        "id": 1,
        "name": "Walking",
        "description": "A gentle walk in a park or neighborhood.",
        "duration": 30,
        "intensity": "low",
        "benefits": "Improves insulin sensitivity and cardiovascular health."
    },
    {
        "id": 2,
        "name": "Yoga",
        "description": "Basic yoga poses like Surya Namaskar and Pranayama.",
        "duration": 20,
        "intensity": "low",
        "benefits": "Reduces stress and enhances blood sugar control."
    },
    {
        "id": 3,
        "name": "Brisk Walking",
        "description": "A faster-paced walk to elevate heart rate.",
        "duration": 25,
        "intensity": "moderate",
        "benefits": "Boosts metabolism and aids blood glucose regulation."
    },
    {
        "id": 4,
        "name": "Cycling",
        "description": "Stationary or outdoor cycling at a steady pace.",
        "duration": 30,
        "intensity": "moderate",
        "benefits": "Strengthens muscles and improves insulin тобелев sensitivity."
    },
    {
        "id": 5,
        "name": "Jogging",
        "description": "Light jogging in a safe environment.",
        "duration": 20,
        "intensity": "high",
        "benefits": "Enhances cardiovascular fitness and glucose uptake."
    },
    {
        "id": 6,
        "name": "Strength Training",
        "description": "Bodyweight exercises like squats and push-ups.",
        "duration": 15,
        "intensity": "high",
        "benefits": "Builds muscle mass and improves insulin sensitivity."
    }
]

# In-memory data for meal planner
meals = {
    "vegetarian": [
        {
            "id": 1,
            "name": "Chana Masala with Brown Rice",
            "description": "Chickpeas in spiced tomato gravy with brown rice",
            "calories": 350,
            "carbs": 45,
            "glycemic_index": "low",
            "ingredients": ["Chickpeas", "Tomatoes", "Onions", "Ginger", "Garlic", "Brown Rice", "Spices"],
            "instructions": "Soak chickpeas overnight. Cook with spices, tomatoes, and onions. Serve with cooked brown rice.",
            "nutritional_benefits": "High in fiber and plant-based protein, helps maintain stable blood sugar levels.",
            "diet": "vegetarian"
        },
        {
            "id": 2,
            "name": "Rajma Chawal",
            "description": "Kidney beans curry with brown rice",
            "calories": 380,
            "carbs": 48,
            "glycemic_index": "medium",
            "ingredients": ["Kidney Beans", "Brown Rice", "Tomatoes", "Onions", "Spices"],
            "instructions": "Cook kidney beans with spices and tomatoes. Serve with steamed brown rice.",
            "nutritional_benefits": "Rich in fiber and antioxidants, supports heart health.",
            "diet": "vegetarian"
        },
        {
            "id": 3,
            "name": "Palak Paneer with Roti",
            "description": "Spinach and cottage cheese curry with whole wheat flatbread",
            "calories": 320,
            "carbs": 30,
            "glycemic_index": "low",
            "ingredients": ["Spinach", "Paneer", "Whole Wheat Flour", "Spices"],
            "instructions": "Blanch spinach, blend, and cook with spices and paneer. Serve with whole wheat roti.",
            "nutritional_benefits": "High in iron and protein, low glycemic index for blood sugar control.",
            "diet": "vegetarian"
        },
        {
            "id": 4,
            "name": "Quinoa Upma",
            "description": "South Indian style quinoa with vegetables",
            "calories": 280,
            "carbs": 32,
            "glycemic_index": "low",
            "ingredients": ["Quinoa", "Mixed Vegetables", "Mustard Seeds", "Curry Leaves"],
            "instructions": "Cook quinoa, sauté with mustard seeds, curry leaves, and vegetables.",
            "nutritional_benefits": "Complete protein, low GI, rich in fiber.",
            "diet": "vegetarian"
        },
        {
            "id": 5,
            "name": "Moong Dal Khichdi",
            "description": "Split green gram and brown rice porridge",
            "calories": 300,
            "carbs": 40,
            "glycemic_index": "low",
            "ingredients": ["Moong Dal", "Brown Rice", "Vegetables", "Spices"],
            "instructions": "Cook moong dal and brown rice with spices and vegetables until soft.",
            "nutritional_benefits": "Easily digestible, high in protein and fiber.",
            "diet": "vegetarian"
        },
        {
            "id": 18,
            "name": "Vegetable Jowar Roti with Dal",
            "description": "Sorghum flatbread with mixed vegetable curry and lentil dal",
            "calories": 340,
            "carbs": 42,
            "glycemic_index": "low",
            "ingredients": ["Jowar Flour", "Mixed Vegetables", "Moong Dal", "Spices"],
            "instructions": "Prepare jowar roti dough, roll, and cook. Cook dal with spices and vegetables separately. Serve together.",
            "nutritional_benefits": "Low GI, high in fiber, supports stable blood sugar levels.",
            "diet": "vegetarian"
        },
        {
            "id": 19,
            "name": "Bitter Gourd Stir-Fry with Brown Rice",
            "description": "Spiced bitter gourd stir-fry served with brown rice",
            "calories": 290,
            "carbs": 38,
            "glycemic_index": "low",
            "ingredients": ["Bitter Gourd", "Brown Rice", "Onions", "Spices"],
            "instructions": "Sauté sliced bitter gourd with onions and spices. Serve with cooked brown rice.",
            "nutritional_benefits": "Known to help regulate blood sugar, rich in fiber.",
            "diet": "vegetarian"
        },
        {
            "id": 20,
            "name": "Sprouted Moong Salad",
            "description": "Salad with sprouted moong beans, cucumber, and tomatoes",
            "calories": 220,
            "carbs": 28,
            "glycemic_index": "low",
            "ingredients": ["Sprouted Moong", "Cucumber", "Tomatoes", "Lemon", "Spices"],
            "instructions": "Mix sprouted moong with chopped cucumber, tomatoes, lemon juice, and spices.",
            "nutritional_benefits": "High in protein and fiber, low-carb, aids digestion.",
            "diet": "vegetarian"
        },
        {
            "id": 21,
            "name": "Lauki Sabzi with Bajra Roti",
            "description": "Bottle gourd curry with pearl millet flatbread",
            "calories": 310,
            "carbs": 35,
            "glycemic_index": "low",
            "ingredients": ["Bottle Gourd", "Bajra Flour", "Spices"],
            "instructions": "Cook bottle gourd with spices. Prepare bajra roti dough, roll, and cook. Serve together.",
            "nutritional_benefits": "Low GI, rich in fiber, supports heart health.",
            "diet": "vegetarian"
        },
        {
            "id": 22,
            "name": "Masoor Dal Soup with Vegetables",
            "description": "Red lentil soup with mixed vegetables",
            "calories": 270,
            "carbs": 32,
            "glycemic_index": "low",
            "ingredients": ["Masoor Dal", "Mixed Vegetables", "Spices"],
            "instructions": "Cook masoor dal with vegetables and spices until soft. Blend for a smooth texture if desired.",
            "nutritional_benefits": "High in protein, low GI, promotes satiety.",
            "diet": "vegetarian"
        }
    ],
    "non-vegetarian": [
        {
            "id": 6,
            "name": "Tandoori Chicken with Salad",
            "description": "Grilled spiced chicken with green salad",
            "calories": 320,
            "carbs": 10,
            "glycemic_index": "low",
            "ingredients": ["Chicken", "Yogurt", "Spices", "Mixed Greens"],
            "instructions": "Marinate chicken in yogurt and spices, grill, and serve with salad.",
            "nutritional_benefits": "High in lean protein, low in carbs, supports muscle maintenance.",
            "diet": "non-vegetarian"
        },
        {
            "id": 7,
            "name": "Fish Curry with Brown Rice",
            "description": "Spiced fish in tomato gravy with brown rice",
            "calories": 360,
            "carbs": 38,
            "glycemic_index": "medium",
            "ingredients": ["Fish", "Tomatoes", "Brown Rice", "Spices"],
            "instructions": "Cook fish in a spiced tomato gravy, serve with brown rice.",
            "nutritional_benefits": "Rich in omega-3 fatty acids, supports heart health.",
            "diet": "non-vegetarian"
        },
        {
            "id": 8,
            "name": "Egg Bhurji with Multigrain Roti",
            "description": "Spiced scrambled eggs with multigrain flatbread",
            "calories": 290,
            "carbs": 25,
            "glycemic_index": "low",
            "ingredients": ["Eggs", "Multigrain Flour", "Vegetables", "Spices"],
            "instructions": "Scramble eggs with vegetables and spices, serve with multigrain roti.",
            "nutritional_benefits": "High in protein, moderate carbs, good for satiety.",
            "diet": "non-vegetarian"
        },
        {
            "id": 9,
            "name": "Chicken Tikka with Cucumber Raita",
            "description": "Grilled chicken pieces with yogurt dip",
            "calories": 310,
            "carbs": 12,
            "glycemic_index": "low",
            "ingredients": ["Chicken", "Yogurt", "Cucumber", "Spices"],
            "instructions": "Marinate and grill chicken, serve with cucumber raita.",
            "nutritional_benefits": "Low-carb, high-protein, aids in blood sugar control.",
            "diet": "non-vegetarian"
        },
        {
            "id": 10,
            "name": "Mutton Soup with Vegetables",
            "description": "Clear mutton soup with mixed vegetables",
            "calories": 260,
            "carbs": 15,
            "glycemic_index": "low",
            "ingredients": ["Mutton", "Mixed Vegetables", "Spices"],
            "instructions": "Simmer mutton with vegetables and spices to make a clear soup.",
            "nutritional_benefits": "Low-carb, nutrient-dense, supports overall health.",
            "diet": "non-vegetarian"
        },
        {
            "id": 23,
            "name": "Grilled Fish with Sauteed Vegetables",
            "description": "Spiced grilled fish with a side of sauteed non-starchy vegetables",
            "calories": 300,
            "carbs": 12,
            "glycemic_index": "low",
            "ingredients": ["Fish", "Mixed Vegetables", "Spices", "Olive Oil"],
            "instructions": "Marinate fish with spices, grill, and serve with sauteed vegetables in olive oil.",
            "nutritional_benefits": "High in omega-3s, low-carb, supports cardiovascular health.",
            "diet": "non-vegetarian"
        },
        {
            "id": 24,
            "name": "Chicken Stew with Quinoa",
            "description": "Light chicken stew with vegetables and quinoa",
            "calories": 340,
            "carbs": 30,
            "glycemic_index": "low",
            "ingredients": ["Chicken", "Quinoa", "Mixed Vegetables", "Spices"],
            "instructions": "Cook chicken with vegetables and spices in a light broth, serve with quinoa.",
            "nutritional_benefits": "Balanced protein and fiber, low GI, promotes stable blood sugar.",
            "diet": "non-vegetarian"
        },
        {
            "id": 25,
            "name": "Prawn Stir-Fry with Greens",
            "description": "Spiced prawns stir-fried with spinach and bell peppers",
            "calories": 280,
            "carbs": 15,
            "glycemic_index": "low",
            "ingredients": ["Prawns", "Spinach", "Bell Peppers", "Spices"],
            "instructions": "Stir-fry prawns with spinach, bell peppers, and spices. Serve hot.",
            "nutritional_benefits": "Low-carb, high-protein, rich in antioxidants.",
  "diet": "non-vegetarian"
        },
        {
            "id": 26,
            "name": "Mutton Keema with Green Peas",
            "description": "Minced mutton cooked with green peas and spices",
            "calories": 350,
            "carbs": 20,
            "glycemic_index": "low",
            "ingredients": ["Mutton", "Green Peas", "Onions", "Spices"],
            "instructions": "Cook minced mutton with onions, green peas, and spices until tender.",
            "nutritional_benefits": "High in protein, moderate carbs, supports muscle health.",
            "diet": "non-vegetarian"
        },
        {
            "id": 27,
            "name": "Chicken Salad with Olive Oil Dressing",
            "description": "Grilled chicken with mixed greens and olive oil dressing",
            "calories": 290,
            "carbs": 10,
            "glycemic_index": "low",
            "ingredients": ["Chicken", "Mixed Greens", "Olive Oil", "Spices"],
            "instructions": "Grill chicken, toss with mixed greens and olive oil dressing.",
            "nutritional_benefits": "Low-carb, high in healthy fats, aids blood sugar control.",
            "diet": "non-vegetarian"
        }
    ],
    "eggetarian": [
        {
            "id": 11,
            "name": "Egg Curry with Brown Rice",
            "description": "Boiled eggs in spiced tomato gravy with brown rice",
            "calories": 330,
            "carbs": 42,
            "glycemic_index": "medium",
            "ingredients": ["Eggs", "Brown Rice", "Tomatoes", "Spices"],
            "instructions": "Boil eggs, cook in spiced tomato gravy, serve with brown rice.",
            "nutritional_benefits": "Balanced protein and carbs, supports energy needs.",
            "diet": "eggetarian"
        },
        {
            "id": 12,
            "name": "Egg Bhurji with Multigrain Paratha",
            "description": "Spiced scrambled eggs with multigrain flatbread",
            "calories": 300,
            "carbs": 28,
            "glycemic_index": "low",
            "ingredients": ["Eggs", "Multigrain Flour", "Vegetables", "Spices"],
            "instructions": "Scramble eggs with vegetables, serve with multigrain paratha.",
            "nutritional_benefits": "High protein, low GI, promotes satiety.",
            "diet": "eggetarian"
        },
        {
            "id": 13,
            "name": "Vegetable Omelette with Salad",
            "description": "Egg omelette loaded with vegetables and side salad",
            "calories": 250,
            "carbs": 15,
            "glycemic_index": "low",
            "ingredients": ["Eggs", "Mixed Vegetables", "Mixed Greens"],
            "instructions": "Make omelette with vegetables, serve with a side salad.",
            "nutritional_benefits": "Low-carb, high in vitamins and minerals.",
            "diet": "eggetarian"
        },
        {
            "id": 14,
            "name": "Egg Biryani with Raita",
            "description": "Brown rice with eggs and spices, served with yogurt",
            "calories": 380,
            "carbs": 45,
            "glycemic_index": "medium",
            "ingredients": ["Eggs", "Brown Rice", "Yogurt", "Spices"],
            "instructions": "Cook brown rice with eggs and spices, serve with raita.",
            "nutritional_benefits": "Balanced meal, rich in protein and fiber.",
            "diet": "eggetarian"
        },
        {
            "id": 15,
            "name": "Boiled Egg Chaat",
            "description": "Spiced boiled eggs with chickpeas and vegetables",
            "calories": 280,
            "carbs": 30,
            "glycemic_index": "low",
            "ingredients": ["Eggs", "Chickpeas", "Vegetables", "Spices"],
            "instructions": "Boil eggs, mix with chickpeas and spices, top with vegetables.",
            "nutritional_benefits": "High in protein and fiber, low GI.",
            "diet": "eggetarian"
        },
        {
            "id": 28,
            "name": "Egg Spinach Curry with Quinoa",
            "description": "Boiled eggs in spinach curry served with quinoa",
            "calories": 320,
            "carbs": 35,
            "glycemic_index": "low",
            "ingredients": ["Eggs", "Spinach", "Quinoa", "Spices"],
            "instructions": "Boil eggs, cook spinach with spices, add eggs, serve with quinoa.",
            "nutritional_benefits": "Rich in iron and protein, low GI, supports blood sugar control.",
            "diet": "eggetarian"
        },
        {
            "id": 29,
            "name": "Egg and Vegetable Pulao",
            "description": "Brown rice pulao with scrambled eggs and vegetables",
            "calories": 350,
            "carbs": 40,
            "glycemic_index": "medium",
            "ingredients": ["Eggs", "Brown Rice", "Mixed Vegetables", "Spices"],
            "instructions": "Scramble eggs, cook brown rice with vegetables and spices, mix together.",
            "nutritional_benefits": "Balanced carbs and protein, rich in fiber.",
            "diet": "eggetarian"
        },
        {
            "id": 30,
            "name": "Egg Salad with Whole Wheat Bread",
            "description": "Boiled egg salad with vegetables and whole wheat bread",
            "calories": 290,
            "carbs": 28,
            "glycemic_index": "low",
            "ingredients": ["Eggs", "Whole Wheat Bread", "Mixed Vegetables", "Spices"],
            "instructions": "Boil eggs, chop, mix with vegetables and spices, serve with whole wheat bread.",
            "nutritional_benefits": "Low GI, high in protein, promotes satiety.",
            "diet": "eggetarian"
        },
        {
            "id": 31,
            "name": "Egg Masala with Jowar Roti",
            "description": "Spiced egg curry with sorghum flatbread",
            "calories": 310,
            "carbs": 32,
            "glycemic_index": "low",
            "ingredients": ["Eggs", "Jowar Flour", "Onions", "Spices"],
            "instructions": "Cook eggs in a spiced onion gravy, serve with jowar roti.",
            "nutritional_benefits": "Low GI, high in fiber, supports stable blood sugar.",
            "diet": "eggetarian"
        },
        {
            "id": 32,
            "name": "Egg and Paneer Bhurji",
            "description": "Scrambled eggs with paneer and spices",
            "calories": 300,
            "carbs": 15,
            "glycemic_index": "low",
            "ingredients": ["Eggs", "Paneer", "Vegetables", "Spices"],
            "instructions": "Scramble eggs with crumbled paneer, vegetables, and spices.",
            "nutritional_benefits": "High in protein, low-carb, aids in blood sugar control.",
            "diet": "eggetarian"
        }
    ],
    "vegan": [
        {
            "id": 16,
            "name": "Chickpea Curry with Quinoa",
            "description": "Spiced chickpea curry served with quinoa",
            "calories": 340,
            "carbs": 50,
            "glycemic_index": "low",
            "ingredients": ["Chickpeas", "Quinoa", "Tomatoes", "Spices"],
            "instructions": "Cook chickpeas with tomatoes and spices, serve with quinoa.",
            "nutritional_benefits": "High in plant-based protein and fiber, low GI.",
            "diet": "vegan"
        },
        {
            "id": 17,
            "name": "Vegetable Stir-Fry with Tofu",
            "description": "Mixed vegetables stir-fried with tofu",
            "calories": 280,
            "carbs": 20,
            "glycemic_index": "low",
            "ingredients": ["Tofu", "Mixed Vegetables", "Soy Sauce", "Spices"],
            "instructions": "Stir-fry tofu and vegetables with soy sauce and spices.",
            "nutritional_benefits": "Low-carb, high in protein, supports blood sugar control.",
            "diet": "vegan"
        },
        {
            "id": 33,
            "name": "Lentil Soup with Spinach",
            "description": "Red lentil soup with spinach and spices",
            "calories": 260,
            "carbs": 30,
            "glycemic_index": "low",
            "ingredients": ["Masoor Dal", "Spinach", "Spices"],
            "instructions": "Cook red lentils with spinach and spices until soft. Serve hot.",
            "nutritional_benefits": "High in fiber and iron, low GI, promotes digestion.",
            "diet": "vegan"
        },
        {
            "id": 34,
            "name": "Bajra Khichdi with Vegetables",
            "description": "Pearl millet and moong dal khichdi with mixed vegetables",
            "calories": 320,
            "carbs": 40,
            "glycemic_index": "low",
            "ingredients": ["Bajra", "Moong Dal", "Mixed Vegetables", "Spices"],
            "instructions": "Cook bajra and moong dal with vegetables and spices until soft.",
            "nutritional_benefits": "Low GI, high in fiber, supports stable blood sugar.",
            "diet": "vegan"
        }
    ]
}

# User data stores
user_meals = {}
user_profiles = {}
prediction_data = {}
meal_plans = {}
user_exercises = {}
DEFAULT_USER_ID = "default_user"

# Helper function to clean Markdown from text
def clean_markdown(text):
    text = re.sub(r'\*+', '', text)
    text = re.sub(r'#+\s*', '', text)
    text = re.sub(r'-+\s*', '', text)
    text = re.sub(r'\[.*?\]\(.*?\)', '', text)
    text = re.sub(r'`{1,3}.*?`{1,3}', '', text)
    text = re.sub(r'\n\s*\n', '\n', text)
    return text.strip()

# Helper functions for meals
def get_user_meals(user_id, date):
    if user_id not in user_meals:
        user_meals[user_id] = {}
    if date not in user_meals[user_id]:
        user_meals[user_id][date] = []
    return user_meals[user_id][date]

def format_meals_with_date(meals_list, date):
    return [{**meal, "date": date} for meal in meals_list]

def generate_daily_meal_plan(user_id, diet_type, date):
    meal_types = ["Breakfast", "Lunch", "Dinner"]
    daily_meals = []
    profile = user_profiles.get(user_id, {})
    allergies = profile.get("allergies", [])
    avoidances = profile.get("avoidances", [])
    available_meals = [meal for meal in meals.get(diet_type, []) if all(allergy.lower() not in meal["name"].lower() for allergy in allergies) and all(avoidance.lower() not in meal["name"].lower() for avoidance in avoidances)]
    for meal_type in meal_types:
        if available_meals:
            selected_meal = random.choice(available_meals)
            daily_meals.append({
                "meal_type": meal_type,
                "recipes": [selected_meal]
            })
    return {
        "date": date,
        "meals": daily_meals
    }

# Helper functions for exercises
def get_user_exercises(user_id, date):
    if user_id not in user_exercises:
        user_exercises[user_id] = {}
    if date not in user_exercises[user_id]:
        user_exercises[user_id][date] = []
    return user_exercises[user_id][date]

# Diabetes prediction endpoint
# Diabetes prediction endpoint
# Diabetes prediction endpoint
@app.route('/predict', methods=['POST', 'OPTIONS'])
def predict():
    if request.method == 'OPTIONS':
        logger.debug("Handling OPTIONS request")
        response = jsonify({"status": "ok"})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response, 200
    logger.debug(f"Received POST request: {request.get_json()}")
    try:
        data = request.get_json()
        logger.debug(f"Request data: {data}")
        required_fields = ['Pregnancies', 'Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI', 'DiabetesPedigreeFunction', 'Age']
        if not all(field in data for field in required_fields):
            missing = [field for field in required_fields if field not in data]
            logger.error(f"Missing fields: {missing}")
            return jsonify({"error": f"Missing fields: {missing}"}), 400
        input_data = {}
        for field in required_fields:
            try:
                input_data[field] = float(data[field])
            except (ValueError, TypeError):
                logger.error(f"Invalid value for {field}: {data[field]}")
                return jsonify({"error": f"Field {field} must be numeric"}), 400
        # Compute Glucose_Insulin_Ratio and BMI_Category
        input_data['Glucose_Insulin_Ratio'] = input_data['Glucose'] / (input_data['Insulin'] + 1e-6)
        bmi = input_data['BMI']
        if bmi <= 18.5:
            input_data['BMI_Category'] = 0  # Underweight
        elif bmi <= 25:
            input_data['BMI_Category'] = 1  # Normal
        elif bmi <= 30:
            input_data['BMI_Category'] = 2  # Overweight
        else:
            input_data['BMI_Category'] = 3  # Obese
        user_input = np.array([
            input_data['Pregnancies'],
            input_data['Glucose'],
            input_data['BloodPressure'],
            input_data['SkinThickness'],
            input_data['BMI'],
            input_data['DiabetesPedigreeFunction'],
            input_data['Age'],
            input_data['Glucose_Insulin_Ratio'],
            input_data['BMI_Category']
        ]).reshape(1, -1)
        prediction_data[DEFAULT_USER_ID] = input_data
        user_input_scaled = scaler.transform(user_input)
        prediction = model.predict(user_input_scaled)[0]
        probability = model.predict_proba(user_input_scaled)[0][1]
        if probability < 0.3:
            risk_level = "Low"
        elif probability < 0.7:
            risk_level = "Moderate"
        else:
            risk_level = "High"
        logger.info(f"Prediction: {prediction}, Probability: {probability}, Risk Level: {risk_level}")
        return jsonify({
            "prediction": int(prediction),
            "probability": float(probability),
            "riskLevel": risk_level
        })
    except Exception as e:
        logger.error(f"Error in predict: {str(e)}")
        return jsonify({"error": str(e)}), 500

# User profile endpoints
@app.route('/user/profile', methods=['GET', 'POST'])
def user_profile():
    if request.method == 'GET':
        user_id = request.args.get('userId', DEFAULT_USER_ID)
        profile = user_profiles.get(user_id, {})
        return jsonify(profile)
    if request.method == 'POST':
        try:
            data = request.get_json()
            user_id = data.get('userId', DEFAULT_USER_ID)
            if not user_id:
                return jsonify({"error": "User ID is required"}), 400
            required_fields = ['dietType']
            for field in required_fields:
                if field not in data or not data[field]:
                    return jsonify({"error": f"{field} is required"}), 400
            user_profiles[user_id] = {
                "age": data.get('age'),
                "gender": data.get('gender'),
                "weight": data.get('weight'),
                "height": data.get('height'),
                "activityLevel": data.get('activityLevel'),
                "dietType": data.get('dietType', 'vegetarian'),
                "allergies": data.get('allergies', []),
                "preferences": data.get('preferences', []),
                "avoidances": data.get('avoidances', []),
                "diabetesType": data.get('diabetesType'),
                "bloodSugarLevels": data.get('bloodSugarLevels'),
                "medicationDetails": data.get('medicationDetails'),
                "lastUpdated": datetime.now().isoformat()
            }
            return jsonify({"status": "success", "message": "Profile updated"})
        except Exception as e:
            logger.error(f"Error updating profile: {str(e)}")
            return jsonify({"error": str(e)}), 500

# Meal plan generation endpoint
@app.route('/meal-plan/generate', methods=['POST'])
def generate_meal_plan():
    try:
        data = request.get_json()
        user_id = data.get('userId', DEFAULT_USER_ID)
        days = int(data.get('days', 7))
        start_date = data.get('startDate', datetime.now().strftime('%Y-%m-%d'))
        profile = user_profiles.get(user_id, {})
        diet_type = profile.get('dietType', 'vegetarian')
        meal_plan = []
        start = datetime.strptime(start_date, '%Y-%m-%d')
        for i in range(days):
            date = (start + timedelta(days=i)).strftime('%Y-%m-%d')
            daily_plan = generate_daily_meal_plan(user_id, diet_type, date)
            meal_plan.append(daily_plan)
        meal_plans[user_id] = {"meal_plan": meal_plan}
        return jsonify({"meal_plan": meal_plan})
    except Exception as e:
        logger.error(f"Error generating meal plan: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Meal plan retrieval endpoint
@app.route('/meal-plan', methods=['GET'])
def get_meal_plan():
    user_id = request.args.get('userId', DEFAULT_USER_ID)
    meal_plan = meal_plans.get(user_id, {"meal_plan": []})
    return jsonify(meal_plan)

# Recipe search endpoint
@app.route('/recipes/search', methods=['GET'])
def search_recipes():
    query = request.args.get('query', '').lower()
    diet_type = request.args.get('dietType', 'vegetarian')
    user_id = request.args.get('userId', DEFAULT_USER_ID)
    if diet_type not in meals:
        return jsonify({"error": f"Diet type '{diet_type}' not found"}), 400
    profile = user_profiles.get(user_id, {})
    allergies = profile.get('allergies', [])
    avoidances = profile.get('avoidances', [])
    diabetes_type = profile.get('diabetesType', 'Type 2')
    blood_sugar_trend = profile.get('bloodSugarLevels', 'normal')
    local_results = [
        meal for meal in meals[diet_type]
        if (query in meal['name'].lower() or 
            query in meal['description'].lower() or
            any(query in ingredient.lower() for ingredient in meal['ingredients']))
    ]
    filtered_local_results = [
        meal for meal in local_results
        if all(allergy.lower() not in ' '.join(meal['ingredients']).lower() for allergy in allergies) and
        all(avoidance.lower() not in ' '.join(meal['ingredients']).lower() for avoidance in avoidances)
    ]
    try:
        health_context = f"""
        User health profile:
        - Diet type: {diet_type}
        - Diabetes type: {diabetes_type}
        - Recent blood sugar trend: {blood_sugar_trend}
        - Allergies: {', '.join(allergies) if allergies else 'None'}
        - Foods to avoid: {', '.join(avoidances) if avoidances else 'None'}
        """
        prompt = f"""
        Create {3 - min(3, len(filtered_local_results))} diabetes-friendly Indian recipes matching the query: '{query}'.
        {health_context}
        Recipe requirements:
        - Must be suitable for {diet_type} diet
        - Must exclude these ingredients: {', '.join(allergies + avoidances) if (allergies or avoidances) else 'No specific exclusions'}
        - Focus on low to medium glycemic index ingredients
        - Include specific diabetes management benefits in nutritional_benefits field
        - Portion sizes should be appropriate for diabetes management
        - Include specific information about carbohydrate content and effect on blood sugar
        Return recipes in this JSON format:
        [
          {{
            "id": "unique_number",
            "name": "Recipe name",
            "description": "Brief description",
            "calories": number,
            "carbs": number,
            "glycemic_index": "low/medium/high",
            "ingredients": ["ingredient1", "ingredient2", ...],
            "instructions": "Step by step instructions",
            "nutritional_benefits": "Benefits specific to diabetes management",
            "diet": "{diet_type}"
          }}
        ]
        Return only JSON data without any explanations or comments.
        """
        gemini_recipes = []
        if len(filtered_local_results) < 3:
            response = gemini_model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            response_text = response.text
            if response_text:
                if response_text.startswith("```json"):
                    response_text = response_text.split("```json")[1]
                if response_text.endswith("```"):
                    response_text = response_text.split("```")[0]
                response_text = response_text.strip()
                try:
                    gemini_recipes = json.loads(response_text)
                    if not isinstance(gemini_recipes, list):
                        gemini_recipes = [gemini_recipes]
                except json.JSONDecodeError:
                    logger.error(f"Failed to parse Gemini response as JSON: {response_text}")
                    gemini_recipes = []
            max_id = max([meal['id'] for diet in meals.values() for meal in diet], default=0)
            for i, recipe in enumerate(gemini_recipes):
                recipe['id'] = max_id + i + 1
                recipe['diet'] = diet_type
                if 'ingredients' in recipe and isinstance(recipe['ingredients'], str):
                    recipe['ingredients'] = [ing.strip() for ing in recipe['ingredients'].split(',')]
                if 'glycemic_index' not in recipe:
                    recipe['glycemic_index'] = "low"
        combined_results = filtered_local_results + gemini_recipes
        for recipe in combined_results:
            if 'diabetes_tips' not in recipe:
                gi = recipe.get('glycemic_index', 'medium').lower()
                carbs = recipe.get('carbs', 30)
                if gi == 'low' and carbs < 30:
                    recipe['diabetes_tips'] = "Excellent choice for blood sugar management. Low carb content helps prevent blood sugar spikes."
                elif gi == 'low' and carbs >= 30:
                    recipe['diabetes_tips'] = "Good choice with moderate carbs. Monitor portion size to maintain stable blood sugar."
                elif gi == 'medium':
                    recipe['diabetes_tips'] = "Pair with a protein source and fiber-rich vegetables to slow carbohydrate absorption."
                else:
                    recipe['diabetes_tips'] = "Consider reducing portion size and pairing with healthy fats to reduce glycemic impact."
        return jsonify(combined_results)
    except Exception as e:
        logger.error(f"Error in Gemini recipe search: {str(e)}")
        return jsonify(filtered_local_results)

# Enhanced Chatbot endpoint
@app.route('/chatbot', methods=['POST'])
def chatbot():
    try:
        data = request.get_json()
        if not data:
            logger.error("No JSON data provided in request")
            return jsonify({"error": "No JSON data provided"}), 400
        user_id = data.get('userId', DEFAULT_USER_ID)
        message = data.get('message')
        if not message:
            logger.error("Message is required")
            return jsonify({"error": "Message is required"}), 400
        logger.debug(f"Processing chatbot request for user {user_id}: {message}")
        profile = user_profiles.get(user_id, {})
        diet_type = profile.get('dietType', 'vegetarian')
        allergies = profile.get('allergies', [])
        diabetes_type = profile.get('diabetesType', 'Type 2')
        blood_sugar_levels = profile.get('bloodSugarLevels', 'normal')
        age = profile.get('age', 'unknown')
        gender = profile.get('gender', 'unknown')
        weight = profile.get('weight', 'unknown')
        height = profile.get('height', 'unknown')
        activity_level = profile.get('activityLevel', 'moderate')
        medications = profile.get('medicationDetails', 'none')
        pred_data = prediction_data.get(user_id, {})
        glucose = pred_data.get('Glucose', 'unknown')
        bmi = pred_data.get('BMI', 'unknown')
        try:
            prompt = f"""
            You are a nutrition assistant specializing in diabetes management for Indian users. 
            Provide personalized nutrition advice based on this user's complete profile:
            USER PROFILE:
            - Age: {age}
            - Gender: {gender}
            - Weight: {weight}
            - Height: {height}
            - Activity level: {activity_level}
            - Diet type: {diet_type}
            - Allergies/Intolerances: {', '.join(allergies) if allergies else 'None reported'}
            - Diabetes type: {diabetes_type}
            - Recent blood sugar levels: {blood_sugar_levels}
            - Latest glucose reading: {glucose}
            - BMI: {bmi}
            - Current medications: {medications}
            USER QUESTION: {message}
            Guidelines for your response:
            1. Focus on Indian cuisine and dietary patterns
            2. Provide practical, culturally appropriate advice
            3. Include specific food recommendations and alternatives
            4. Be concise but thorough (150-250 words)
            5. When relevant, include glycemic index information
            6. Emphasize how specific food choices affect blood sugar
            7. If appropriate, suggest meal timing recommendations
            8. If suggesting foods, prioritize those available in India
            9. Return plain text without any Markdown formatting (no asterisks, bullet points, bold text, or other Markdown syntax)
            10. Use simple paragraphs or numbered lists without special characters
            If you don't have enough information to provide personalized advice, 
            ask relevant follow-up questions first, then provide general diabetes nutrition guidelines.
            """
            response = gemini_model.generate_content(prompt)
            gemini_response = response.text.strip()
            if not gemini_response:
                logger.warning("Empty response from Gemini API")
                gemini_response = "I'm sorry, I couldn't generate a response. Please try rephrasing your question or ask something else."
            gemini_response = clean_markdown(gemini_response)
            logger.debug(f"Gemini response: {gemini_response}")
            if any(keyword in message.lower() for keyword in ['medicine', 'medication', 'insulin', 'doctor', 'treatment', 'diagnosis']):
                disclaimer = "\n\nPlease note: This advice is for informational purposes only and should not replace medical guidance. Always consult your healthcare provider before making changes to your diet or diabetes management plan."
                gemini_response += disclaimer
            return jsonify({"response": gemini_response})
        except Exception as e:
            logger.error(f"Gemini API error in chatbot: {str(e)}")
            fallback_response = f"I understand you're asking about '{message}'. I'm currently unable to connect to the nutrition advice service. Here's some general advice: Focus on low glycemic index foods like whole grains (brown rice, quinoa), legumes, and non-starchy vegetables. Monitor portion sizes and include protein-rich foods to stabilize blood sugar. Please try again or consult a dietitian for personalized advice."
            return jsonify({"response": fallback_response})
    except Exception as e:
        logger.error(f"Error in chatbot endpoint: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

# Exercise recommendation endpoint with Gemini integration
@app.route('/exercises/recommend', methods=['GET'])
def recommend_exercises():
    try:
        user_id = request.args.get('userId', DEFAULT_USER_ID)
        profile = user_profiles.get(user_id, {})
        age = profile.get('age', 'unknown')
        activity_level = profile.get('activityLevel', 'moderate')
        diabetes_type = profile.get('diabetesType', 'Type 2')
        weight = profile.get('weight', 'unknown')
        height = profile.get('height', 'unknown')
        blood_sugar_levels = profile.get('bloodSugarLevels', 'normal')
        pred_data = prediction_data.get(user_id, {})
        bmi = pred_data.get('BMI', 'unknown')
        health_context = f"""
        User health profile:
        - Age: {age}
        - Activity level: {activity_level}
        - Diabetes type: {diabetes_type}
        - Weight: {weight}
        - Height: {height}
        - Recent blood sugar levels: {blood_sugar_levels}
        - BMI: {bmi}
        """
        prompt = f"""
        Create 3 diabetes-friendly exercise recommendations tailored for an Indian user with the following profile:
        {health_context}
        Exercise requirements:
        - Must be suitable for diabetes management, prioritizing blood sugar control
        - Must match the user's activity level ({activity_level})
        - For Type 1 diabetes, avoid high-intensity exercises to prevent hypoglycemia
        - Focus on accessible activities available in India (e.g., walking, yoga, home-based exercises)
        - Include specific benefits for diabetes management in the benefits field
        - Duration should be appropriate for the user's profile (15-30 minutes)
        Return exercises in this JSON format:
        [
          {{
            "id": "unique_number",
            "name": "Exercise name",
            "description": "Brief description",
            "duration": number,
            "intensity": "low/moderate/high",
            "benefits": "Benefits specific to diabetes management"
          }}
        ]
        Return only JSON data without any explanations or comments.
        """
        gemini_exercises = []
        try:
            response = gemini_model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            response_text = response.text.strip()
            if response_text.startswith("```json"):
                response_text = response_text.split("```json")[1]
            if response_text.endswith("```"):
                response_text = response_text.split("```")[0]
            response_text = response_text.strip()
            gemini_exercises = json.loads(response_text)
            if not isinstance(gemini_exercises, list):
                gemini_exercises = [gemini_exercises]
            max_id = max([ex['id'] for ex in exercises], default=0)
            for i, exercise in enumerate(gemini_exercises):
                exercise['id'] = max_id + i + 1
            # Cache the recommended exercises for the user
            recommended_exercises_cache[user_id] = gemini_exercises
        except Exception as e:
            logger.error(f"Error in Gemini exercise recommendation: {str(e)}")
            gemini_exercises = []
        
        # Combine Gemini recommendations with static exercises, ensuring no duplicates
        combined_exercises = gemini_exercises[:]
        existing_ids = {ex['id'] for ex in combined_exercises}
        for static_exercise in exercises:
            if static_exercise['id'] not in existing_ids:
                combined_exercises.append(static_exercise)
                existing_ids.add(static_exercise['id'])
        
        return jsonify(combined_exercises)
    except Exception as e:
        logger.error(f"Error in recommend_exercises: {str(e)}")
        # Fallback to static exercises if the entire endpoint fails
        return jsonify(exercises)

@app.route('/exercises', methods=['GET'])
def get_exercises():
    return jsonify(exercises)

@app.route('/user/exercises', methods=['GET'])
def get_user_exercises_endpoint():
    date = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
    user_id = DEFAULT_USER_ID
    user_exercises_list = get_user_exercises(user_id, date)
    return jsonify(user_exercises_list)

@app.route('/user/exercises', methods=['POST'])
def add_user_exercise():
    try:
        data = request.get_json()
        exercise_id = data.get('exercise_id')
        duration = data.get('duration')
        date = data.get('date', datetime.now().strftime('%Y-%m-%d'))
        user_id = DEFAULT_USER_ID
        if not exercise_id or not duration:
            return jsonify({"error": "Exercise ID and duration are required"}), 400
        found_exercise = None
        # Check static exercises
        for exercise in exercises:
            if exercise['id'] == exercise_id:
                found_exercise = exercise
                break
        # Check recommended exercises cache if not found in static exercises
        if not found_exercise and user_id in recommended_exercises_cache:
            for exercise in recommended_exercises_cache[user_id]:
                if exercise['id'] == exercise_id:
                    found_exercise = exercise
                    break
        if not found_exercise:
            return jsonify({"error": f"Exercise with ID {exercise_id} not found"}), 404
        user_exercises_list = get_user_exercises(user_id, date)
        user_exercise = {**found_exercise, "user_duration": duration, "date": date}
        user_exercises_list.append(user_exercise)
        return jsonify({"status": "success", "message": "Exercise logged successfully"})
    except Exception as e:
        logger.error(f"Error logging exercise: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Other endpoints (unchanged)
@app.route('/meals', methods=['GET'])
def get_meals():
    diet = request.args.get('diet', 'vegetarian')
    if diet not in meals:
        return jsonify({"error": f"Diet type '{diet}' not found"}), 400
    return jsonify(meals[diet])

@app.route('/user/meals', methods=['GET'])
def get_user_meal_plan():
    date = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
    user_id = DEFAULT_USER_ID
    user_meals_list = get_user_meals(user_id, date)
    formatted_meals = format_meals_with_date(user_meals_list, date)
    return jsonify(formatted_meals)

@app.route('/user/meals', methods=['POST'])
def add_user_meal():
    try:
        data = request.get_json()
        meal_id = data.get('meal_id')
        date = data.get('date', datetime.now().strftime('%Y-%m-%d'))
        user_id = DEFAULT_USER_ID
        if not meal_id:
            return jsonify({"error": "Meal ID is required"}), 400
        found_meal = None
        for diet_type in meals:
            for meal in meals[diet_type]:
                if meal['id'] == meal_id:
                    found_meal = meal
                    break
            if found_meal:
                break
        if not found_meal:
            return jsonify({"error": f"Meal with ID {meal_id} not found"}), 404
        user_meals_list = get_user_meals(user_id, date)
        if not any(meal['id'] == meal_id for meal in user_meals_list):
            user_meals_list.append(found_meal)
        return jsonify({"status": "success", "message": "Meal added successfully"})
    except Exception as e:
        logger.error(f"Error adding meal: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/user/meals/<int:meal_id>', methods=['DELETE'])
def delete_user_meal(meal_id):
    date = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
    user_id = DEFAULT_USER_ID
    if user_id in user_meals and date in user_meals[user_id]:
        user_meals[user_id][date] = [meal for meal in user_meals[user_id][date] if meal['id'] != meal_id]
        return jsonify({"status": "success", "message": "Meal removed successfully"})
    return jsonify({"error": "Meal not found"}), 404

@app.route('/user/summary', methods=['GET'])
def get_user_summary():
    date = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
    user_id = DEFAULT_USER_ID
    user_meals_list = get_user_meals(user_id, date)
    total_calories = sum(meal.get('calories', 0) for meal in user_meals_list)
    total_carbs = sum(meal.get('carbs', 0) for meal in user_meals_list)
    gi_values = [1 if meal.get('glycemic_index', '').lower() == 'low' else 2 if meal.get('glycemic_index', '').lower() == 'medium' else 3 for meal in user_meals_list if meal.get('glycemic_index')]
    avg_glycemic_index = sum(gi_values) / len(gi_values) if gi_values else 0
    avg_gi_label = 'low' if avg_glycemic_index <= 1.5 else 'medium' if avg_glycemic_index <= 2.5 else 'high'
    user_exercises_list = get_user_exercises(user_id, date)
    exercises_summary = {
        "total_duration": sum(ex.get('user_duration', 0) for ex in user_exercises_list),
        "intensities": [ex.get('intensity', 'unknown') for ex in user_exercises_list]
    }
    summary = {
        "meals": {
            "total_calories": total_calories,
            "total_carbs": total_carbs,
            "avg_glycemic_index": avg_gi_label
        },
        "exercises": exercises_summary
    }
    return jsonify(summary)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)