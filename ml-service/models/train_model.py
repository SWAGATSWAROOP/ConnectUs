import pandas as pd
import numpy as np
import pickle
import os
from math import radians, cos, sin, asin, sqrt
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeRegressor
from sklearn import metrics
from pathlib import Path

def distance_transform(longitude1, latitude1, longitude2, latitude2):
    travel_dist = []
    for pos in range(len(longitude1)):
        long1, lati1, long2, lati2 = map(radians, [longitude1[pos], latitude1[pos], longitude2[pos], latitude2[pos]])
        dist_long = long2 - long1
        dist_lati = lati2 - lati1
        a = sin(dist_lati / 2)**2 + cos(lati1) * cos(lati2) * sin(dist_long / 2)**2
        c = 2 * asin(sqrt(a)) * 6371
        travel_dist.append(c)
    return travel_dist

def remove_outlier(df1, col):
    Q1 = df1[col].quantile(0.25)
    Q3 = df1[col].quantile(0.75)
    IQR = Q3 - Q1
    lower = Q1 - 1.5 * IQR
    upper = Q3 + 1.5 * IQR
    df1[col] = np.clip(df1[col], lower, upper)
    return df1

def treat_outliers_all(df1, col_list):
    for c in col_list:
        df1 = remove_outlier(df1, c)
    return df1

def train_and_save_model(data_path='./data/nyc.csv', model_path='decision_tree_prune.pkl', backup_path='decision_tree_prune_backup.pkl'):
    df = pd.read_csv(data_path)
    df.drop(['Unnamed: 0', 'key'], axis=1, inplace=True, errors='ignore')
    df.dropna(inplace=True)

    df['pickup_datetime'] = pd.to_datetime(df['pickup_datetime'], format='%Y-%m-%d %H:%M:%S UTC', errors='coerce')
    df = df.dropna(subset=['pickup_datetime'])

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

    df = df[df['fare_amount'] >= 0]

    medianFiller = lambda x: x.fillna(x.median())
    numeric_columns = df.select_dtypes(include=np.number).columns.tolist()
    exclude_cols = ['Date', 'passenger_count', 'year', 'Month', 'Day', 'Hour', 'Minute']
    numeric_columns = [col for col in numeric_columns if col not in exclude_cols]

    df[numeric_columns] = df[numeric_columns].apply(medianFiller, axis=0)
    df.loc[df['passenger_count'] > 6, 'passenger_count'] = np.nan
    df['passenger_count'] = df['passenger_count'].fillna(6)

    df = treat_outliers_all(df, numeric_columns)
    df = df[(df.dist_travel_km >= 1) & (df.dist_travel_km <= 130)]

    df = df[
        (df.pickup_latitude.between(-90, 90)) &
        (df.dropoff_latitude.between(-90, 90)) &
        (df.pickup_longitude.between(-180, 180)) &
        (df.dropoff_longitude.between(-180, 180))
    ]

    df.drop(['pickup_datetime'], axis=1, inplace=True, errors='ignore')

    y = df['fare_amount']
    x = df.drop('fare_amount', axis=1)

    x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.25, random_state=42)

    model = DecisionTreeRegressor(max_depth=10, max_leaf_nodes=32, random_state=10)
    model.fit(x_train, y_train)

    y_pred = model.predict(x_test)
    r_squared = model.score(x_test, y_test)
    n, p = x_test.shape
    adj_r_squared = 1 - (1 - r_squared) * (n - 1) / (n - p - 1)
    rmse = np.sqrt(metrics.mean_squared_error(y_test, y_pred))

    # Save model & backup
    if Path(model_path).exists():
        os.replace(model_path, backup_path)

    with open(model_path, 'wb') as f:
        pickle.dump(model, f)

    return {
        'status': 'Model retrained and saved.',
        'r_squared': r_squared,
        'adj_r_squared': adj_r_squared,
        'rmse': rmse
    }
