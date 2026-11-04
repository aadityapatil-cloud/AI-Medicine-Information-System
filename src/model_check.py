import joblib


# Load saved disease model
model = joblib.load(
    "models/disease_logistic_regression.pkl"
)

# Load label encoder
encoder = joblib.load(
    "models/disease_label_encoder.pkl"
)

# Load feature names
features = joblib.load(
    "models/disease_feature_names.pkl"
)


print("=" * 60)
print("DISEASE MODEL CHECK")
print("=" * 60)

print("\nModel loaded:")
print(type(model).__name__)

print("\nNumber of features:")
print(len(features))

print("\nNumber of diseases:")
print(len(encoder.classes_))

print("\nFirst 10 features:")
for feature in features[:10]:
    print("-", feature)

print("\nFirst 10 diseases:")
for disease in encoder.classes_[:10]:
    print("-", disease)