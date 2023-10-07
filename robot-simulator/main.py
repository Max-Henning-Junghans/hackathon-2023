from threading import Thread
from time import sleep

import influxdb_client
import numpy as np
from flask import Flask, request
from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS

token = "0mQM1AAcncsU-9T_tmTdXZdoqfAmbIJlFV04DOr_emc_DxeriyKovlzN7x7vf1RwYuVEqDS_x7kSxVwWL-AoNg=="
org = "draeger"
url = "http://10.130.1.221:8086"

client = influxdb_client.InfluxDBClient(url=url, token=token, org=org)

bucket = "robomaster"

write_api = client.write_api(write_options=SYNCHRONOUS)

position = np.array([0.0, 0.0])
max_velocity = 0.2
target = np.array([0.0, 0.0])

app = Flask(__name__)


@app.route("/", methods=["POST"])
def drive():
    global target
    data = request.get_json()
    target = np.array([data["x"], data["y"]])
    while (target != position).all():
        print("while")
        continue
    return "OK"


def run_loop():
    global position, target, max_velocity
    print("Starting loop")
    while True:
        direction = target - position
        distance = np.linalg.norm(direction)
        if distance > max_velocity:
            direction = direction / distance * max_velocity
        position = position + direction
        print("Current position: ", position)
        point = Point("simulated_robot")\
                .field("x", position[0])\
                .field("y", position[1])
        write_api.write(bucket=bucket, org="draeger", record=point)
        sleep(1.0)


if __name__ == "__main__":
    thread = Thread(target=run_loop)
    thread.start()
    app.run(host="0.0.0.0", port=5000)
    thread.join()
