import requests
import threading
import influxdb_client
from time import sleep
from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS
import numpy as np


def drive(target):
    print(f"Driving to {target}")
    url = "http://127.0.0.1:1337/"
    payload = {"x": target[0], "y": target[1]}
    requests.post(url, json=payload)
    requests.get(url + "wait")
    print("Done")


def speed(command):
    print(f"Speed to {command}")
    url = "http://127.0.0.1:1337/speed"
    payload = {"x": command[0], "y": command[1], "z": command[2]}
    requests.post(url, json=payload)
    print("Done")


def stop():
    url = "http://127.0.0.1:1337/stop"
    requests.get(url)
    print("STOPPING")


def alarm():
    url = "http://127.0.0.1:1337/alarm"
    requests.get(url)
    print("alarm")


is_measure = True


def get_latest():
    token = "1LIAK2SfvBun7WqqldPvjDoQjeuFJm7kLp8rY_dzLAhpzyb9QRrEGoiLdevXrXaVJUSm8aEcih9B1dAnf833qw=="
    org = "draeger"
    url = "http://10.130.1.221:8086"

    client = influxdb_client.InfluxDBClient(url=url, token=token, org=org)
    query_api = client.query_api()
    query = """
        from(bucket: "robomaster")
        |> range(start: -10s)
        |> filter(fn: (r) => r["_measurement"] == "sps30" and r["_field"] == "number_pm10")
        |> keep(columns: ["_time", "_field", "_value"])
        |> last()
    """
    response = query_api.query(query, org="draeger")
    try:
        return response[0].records[0]["_value"]
    except IndexError:
        return 0
        print("No data")


def measure():
    THRESHOLD = 20.0
    last_value = 1000.0

    while True:
        new_value = get_latest()
        if new_value - last_value > THRESHOLD:
            print(f"FOUND: {new_value}")
            print("Setting measured to False")
            global is_measure
            is_measure = False
            stop()
            break
        last_value = new_value


thread = threading.Thread(target=measure)
thread.start()
mode = "left-right"
side = "high"
i = 0

while is_measure:
    print(f"MEASURE: {is_measure}")
    if mode == "left-right":
        i = (i + 1)
        if i == 20:
            mode = "up-down"
            continue
        if side == "low":
            drive((i / 10.0, 0))
            side = "high"
        else:
            drive((i / 10.0, 2.0))
            side = "low"
    else:
        i = (i - 1)
        if i == 0:
            mode = "left-right"
            continue
        if side == "low":
            drive((0, i / 10.0))
            side = "high"
        else:
            drive((2.0, i / 10.0))
            side = "low"
alarm()
while True:
    print("ALERT")
    storage = get_latest()
    sign = 1.0
    while True:
        new_value = get_latest()
        if new_value < storage:
            speed([0, 0, -1.0 * sign * 25])
            sleep(1)
            speed([0.2, 0, 0])
            sleep(1)
            storage = 0.0
            print("FOUND")
            sign = sign * -1.0
            continue
        speed([0, 0, sign * 25])
        sleep(1)
        speed([0, 0, 0])
        sleep(1)
        storage = new_value
