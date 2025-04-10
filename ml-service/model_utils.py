import pandas as pd
import joblib
from sklearn.ensemble import GradientBoostingRegressor
import os

MODEL_PATH = 'models/model.pkl'
THRESHOLD = 10  # Minimum samples required to retrain


def train_model(X, y):
    """
    Train a GradientBoostingRegressor with specified parameters.
    """
    model = GradientBoostingRegressor(
        loss='absolute_error',
        learning_rate=0.1,
        n_estimators=1000,
        max_depth=1,
        max_features=10,
        random_state=42
    )
    model.fit(X, y)
    return model


def save_model(model, X_train, y_train, path=MODEL_PATH):
    """
    Save the model and training data for future retraining.
    """
    os.makedirs(os.path.dirname(path), exist_ok=True)
    joblib.dump((model, X_train, y_train), path)


def load_model(path=MODEL_PATH):
    """
    Load model and training data. If unavailable, initialize empty structures.
    """
    if os.path.exists(path):
        try:
            model, X_train, y_train = joblib.load(path)
        except Exception as e:
            print(f"Error loading model: {e}")
            model, X_train, y_train = None, pd.DataFrame(), pd.Series(dtype=float)
    else:
        model, X_train, y_train = None, pd.DataFrame(), pd.Series(dtype=float)
    
    return model, X_train, y_train