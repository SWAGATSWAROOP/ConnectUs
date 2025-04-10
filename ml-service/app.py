from flask import Flask, request, render_template, jsonify
import pandas as pd
import pickle
from flask_cors import CORS 
import joblib
import os
from datetime import datetime
from math import radians, sin, cos, sqrt, asin
from sklearn.ensemble import GradientBoostingRegressor

app = Flask(__name__)
CORS(app)

# Paths
model_main_path = 'models/decision_tree_prune.pkl'
model_backup_path = 'models/decision_tree_prune.pkl'

data_store_path = 'data/nyc.csv'


with open(model_main_path, 'rb') as f_main:
    model_main = pickle.load(f_main)

with open(model_backup_path, 'rb') as f_backup:
    model_backup = pickle.load(f_backup)

def distance_transform(longitude1, latitude1, longitude2, latitude2):
    travel_dist = []
    for pos in range(len(longitude1)):
        long1, lati1, long2, lati2 = map(radians, [longitude1[pos], latitude1[pos], longitude2[pos], latitude2[pos]])
        dist_long = long2 - long1
        dist_lati = lati2 - lati1
        a = sin(dist_lati / 2) ** 2 + cos(lati1) * cos(lati2) * sin(dist_long / 2) ** 2
        c = 2 * asin(sqrt(a)) * 6371
        travel_dist.append(c)
    return travel_dist


def feature_engineering(df):
    df['pickup_datetime'] = pd.to_datetime(df['pickup_datetime'], format='%Y-%m-%d %H:%M:%S.%f')
    df['year'] = df['pickup_datetime'].dt.year
    df['Month'] = df['pickup_datetime'].dt.month
    df['Date'] = df['pickup_datetime'].dt.day
    df['Day'] = df['pickup_datetime'].dt.dayofweek
    df['Hour'] = df['pickup_datetime'].dt.hour
    df['Minute'] = df['pickup_datetime'].dt.minute
    df['dist_travel_km'] = distance_transform(
        df['pickup_longitude'].to_numpy(),
        df['pickup_latitude'].to_numpy(),
        df['dropoff_longitude'].to_numpy(),
        df['dropoff_latitude'].to_numpy()
    )
    return df

def load_and_prepare_data():
    if not os.path.exists(data_store_path):
        return None, "Data file not found."

    df = pd.read_csv(data_store_path)

    if 'pickup_datetime' not in df.columns:
        return None, "'pickup_datetime' column missing."

    df['pickup_datetime'] = pd.to_datetime(df['pickup_datetime'])

    # Extract datetime components
    df['year'] = df['pickup_datetime'].dt.year
    df['month'] = df['pickup_datetime'].dt.month
    df['day'] = df['pickup_datetime'].dt.day
    df['hour'] = df['pickup_datetime'].dt.hour
    df['weekday'] = df['pickup_datetime'].dt.weekday 
    df['weekend'] = df['weekday'].apply(lambda x: 'Weekend' if x >= 5 else 'Weekday')

    return df, None

def aggregate_stats(df, column, group_type, year=None, month=None):
    if group_type == 'yearly':
        grouped = df.groupby('year')[column].agg(['max', 'min', 'mean', 'count']).reset_index()
        group_key = 'year'
    elif group_type == 'monthly':
        if year is None:
            return None, "Missing 'year_name' for monthly aggregation."
        df = df[df['year'] == int(year)]
        grouped = df.groupby('month')[column].agg(['max', 'min', 'mean', 'count']).reset_index()
        group_key = 'month'
    elif group_type == 'daily':
        if year is None or month is None:
            return None, "Missing 'year_name' and/or 'month_name' for daily aggregation."
        df = df[(df['year'] == int(year)) & (df['month'] == int(month))]
        grouped = df.groupby('day')[column].agg(['max', 'min', 'mean', 'count']).reset_index()
        group_key = 'day'
    elif group_type == 'hourly':
        if year is None or month is None:
            return None, "Missing 'year_name' and/or 'month_name' for hourly aggregation."
        df = df[(df['year'] == int(year)) & (df['month'] == int(month))]
        grouped = df.groupby('hour')[column].agg(['max', 'min', 'mean', 'count']).reset_index()
        group_key = 'hour'
    else:
        return None, "Invalid type. Use one of: yearly, monthly, daily, hourly"

    # Round float values (optional)
    grouped = grouped.round(6)

    # Convert to the desired dictionary format
    result = {col: grouped[col].tolist() for col in grouped.columns}
    result[group_key] = grouped[group_key].tolist()

    return result, None

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.form
        features = {
            'pickup_datetime': datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S.%f'),
            'pickup_longitude': float(data.get('pickup_longitude', 0)),
            'pickup_latitude': float(data.get('pickup_latitude', 0)),
            'dropoff_longitude': float(data.get('dropoff_longitude', 0)),
            'dropoff_latitude': float(data.get('dropoff_latitude', 0)),
            'passenger_count': int(data.get('passenger_count', 1))
        }

        df = pd.DataFrame([features])
        df = feature_engineering(df)

        prediction = model_main.predict(df.drop(columns=['pickup_datetime']))[0]

        return render_template('index.html', prediction=f"Predicted Fare: ${prediction:.2f}")
    except Exception as e:
        return render_template('index.html', prediction=f"Error: {str(e)}")
                               
import numpy as np
from numpy.linalg import norm

@app.route('/retrain', methods=['POST'])
def retrain():
    try:
        data = request.form
        actual_fare = float(data.get('fare_amount', 0))

        features = {
            'pickup_datetime': datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S.%f'),
            'pickup_longitude': float(data.get('pickup_longitude', 0)),
            'pickup_latitude': float(data.get('pickup_latitude', 0)),
            'dropoff_longitude': float(data.get('dropoff_longitude', 0)),
            'dropoff_latitude': float(data.get('dropoff_latitude', 0)),
            'passenger_count': int(data.get('passenger_count', 1))
        }

        df_new = pd.DataFrame([features])
        df_new = feature_engineering(df_new)

        pred = model_main.predict(df_new.drop(columns=['pickup_datetime']))[0]

        if abs(pred - actual_fare) < 4:
            df_new['fare_amount'] = actual_fare

            if os.path.exists(data_store_path):
                df_existing = pd.read_csv(data_store_path)

                # Apply same feature engineering to existing data
                df_existing_fe = feature_engineering(df_existing.copy())

                # Drop non-feature columns
                cols_to_drop = ['pickup_datetime', 'fare_amount']
                df_existing_features = df_existing_fe.drop(columns=[col for col in cols_to_drop if col in df_existing_fe])
                df_new_features = df_new.drop(columns=[col for col in cols_to_drop if col in df_new])

                # Covariance similarity check
                cov_existing = np.cov(df_existing_features.T)
                cov_new = np.cov(df_new_features.T)

                # Frobenius norm based similarity
                diff_norm = norm(cov_existing - cov_new, 'fro')
                similarity_threshold = 1.0  # You can tweak this threshold

                if diff_norm < similarity_threshold:
                    df_combined = pd.concat([df_existing, df_new])
                    df_combined.to_csv(data_store_path, index=False)
                    msg = f"Prediction: ${pred:.2f}, Retraining data retained (covariance matched)."
                else:
                    msg = f"Prediction: ${pred:.2f}, Data not retained (covariance mismatch)."
            else:
                df_new.to_csv(data_store_path, index=False)
                msg = f"Prediction: ${pred:.2f}, First retraining data stored."
        else:
            msg = f"Prediction: ${pred:.2f}, Error too large. Not stored."

        return render_template('index.html', prediction=msg)

    except Exception as e:
        return render_template('index.html', prediction=f"Retrain Error: {str(e)}")


@app.route('/train_model', methods=['POST'])
def train_model():
    try:
        if not os.path.exists(data_store_path):
            return jsonify({'status': 'No new data to train on.'})

        df = pd.read_csv(data_store_path)

        if 'fare_amount' not in df.columns:
            return jsonify({'status': 'Missing fare_amount in data.'})

        X = df.drop(columns=['fare_amount', 'pickup_datetime'])
        y = df['fare_amount']

        model = GradientBoostingRegressor(
            loss='absolute_error',
            learning_rate=0.1,
            n_estimators=500,
            max_depth=3,
            random_state=42
        )
        model.fit(X, y)

        # Backup old model and save new one
        pickle.dump(model_main, model_backup_path)
        pickle.dump(model, model_main_path)

        return jsonify({'status': 'Model retrained and saved.'})
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/statistics/fare', methods=['GET'])
def fare_statistics():
    group_type = request.args.get('type', '').lower()
    year = request.args.get('year_name')
    month = request.args.get('month_name')

    df, error = load_and_prepare_data()
    if error:
        return jsonify({'error': error})

    if 'fare_amount' not in df.columns:
        return jsonify({'error': "'fare_amount' column missing."})

    result, error = aggregate_stats(df, 'fare_amount', group_type, year, month)
    if error:
        return jsonify({'error': error})

    return jsonify(result)


@app.route('/statistics/passenger_count', methods=['GET'])
def passenger_statistics():
    group_type = request.args.get('type', '').lower()
    year = request.args.get('year_name')
    month = request.args.get('month_name')

    df, error = load_and_prepare_data()
    if error:
        return jsonify({'error': error})

    if 'passenger_count' not in df.columns:
        return jsonify({'error': "'passenger_count' column missing."})

    result, error = aggregate_stats(df, 'passenger_count', group_type, year, month)
    if error:
        return jsonify({'error': error})

    return jsonify(result)

# ------------------ Run the App ------------------ #

if __name__ == '__main__':
    app.run(debug=True)
