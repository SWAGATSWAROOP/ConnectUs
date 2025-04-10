import pandas as pd
import joblib
from sklearn.ensemble import GradientBoostingRegressor

MODEL_PATH = 'model.pkl'
THRESHOLD = 10  # Minimum samples required to retrain

def train_model(X, y):
    model = GradientBoostingRegressor(loss='absolute_error', learning_rate=0.1, n_estimators=1000, max_depth=1, random_state=42,  max_features=10)
    model.fit(X, y)
    return model

def save_model(model, X_train, y_train):
    joblib.dump((model, X_train, y_train), MODEL_PATH)

def load_model():
    try:
        model, X_train, y_train = joblib.load(MODEL_PATH)
    except:
        X_train = pd.DataFrame()  # You’ll need to load your initial training data here
        y_train = pd.Series()
        model = train_model(X_train, y_train)
        save_model(model, X_train, y_train)
    return model, X_train, y_train
