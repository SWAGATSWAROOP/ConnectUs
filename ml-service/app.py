from flask import Flask, request, render_template, jsonify
import pandas as pd
import joblib
import os
from datetime import datetime
from math import radians, sin, cos, sqrt, asin
from sklearn.ensemble import GradientBoostingRegressor

app = Flask(__name__)

# Paths
model_main_path = 'models/model_main.pkl'
model_backup_path = 'models/model_backup.pkl'
data_store_path = 'data/new_data.csv'

# Load models
model_main = joblib.load(model_main_path)
model_backup = joblib.load(model_backup_path)

threshold = 100  

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
    df['weekday'] = df['pickup_datetime'].dt.weekday  # Monday = 0
    df['weekend'] = df['weekday'].apply(lambda x: 'Weekend' if x >= 5 else 'Weekday')

    return df, None


def aggregate_stats(df, column, group_type):
    group_map = {
        'year': 'year',
        'month': 'month',
        'day': 'day',
        'weekday': 'weekday',
        'weekend': 'weekend'
    }

    if group_type not in group_map:
        return None, "Invalid type. Use one of: year, month, day, weekday, weekend"

    group_col = group_map[group_type]

    grouped = df.groupby(group_col)[column].agg(
        max='max',
        min='min',
        mean='mean',
        count='count',
        std='std'
    ).reset_index()

    return grouped.to_dict(orient='records'), None


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
        joblib.dump(model_main, model_backup_path)
        joblib.dump(model, model_main_path)

        return jsonify({'status': 'Model retrained and saved.'})
    except Exception as e:
        return jsonify({'error': str(e)})


@app.route('/statistics/fare', methods=['GET'])
def fare_statistics():
    group_type = request.args.get('type', '').lower()
    df, error = load_and_prepare_data()
    if error:
        return jsonify({'error': error})

    if 'fare_amount' not in df.columns:
        return jsonify({'error': "'fare_amount' column missing."})

    result, error = aggregate_stats(df, 'fare_amount', group_type)
    if error:
        return jsonify({'error': error})

    return jsonify(result)


@app.route('/statistics/passenger_count', methods=['GET'])
def passenger_statistics():
    group_type = request.args.get('type', '').lower()
    df, error = load_and_prepare_data()
    if error:
        return jsonify({'error': error})

    if 'passenger_count' not in df.columns:
        return jsonify({'error': "'passenger_count' column missing."})

    result, error = aggregate_stats(df, 'passenger_count', group_type)
    if error:
        return jsonify({'error': error})

    return jsonify(result)

# ------------------ Run the App ------------------ #

if __name__ == '__main__':
    app.run(debug=True)
