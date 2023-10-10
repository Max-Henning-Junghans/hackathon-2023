import influxdb_client
from time import sleep
import numpy as np
import robomaster
from flask import Flask, request
from influxdb_client.client.write_api import SYNCHRONOUS
from robomaster import robot

position = np.array([0.0, 0.0])

token = "0mQM1AAcncsU-9T_tmTdXZdoqfAmbIJlFV04DOr_emc_DxeriyKovlzN7x7vf1RwYuVEqDS_x7kSxVwWL-AoNg=="
org = "draeger"
url = "http://10.130.1.221:8086"

client = influxdb_client.InfluxDBClient(url=url, token=token, org=org)
bucket = "robomaster"

write_api = client.write_api(write_options=SYNCHRONOUS)


def sub_position_handler(position_info):
    global position
    x, y, orientation = position_info
    y = -y
    print(f"Position: {x}, {y}, {orientation}")
    position = [x, y]
    print(position)
    point = influxdb_client.Point("robot_position").field("x", x).field("y", y)
    write_api.write(bucket=bucket, org="draeger", record=point)


app = Flask(__name__)

is_moving = True


@app.route("/", methods=["POST"])
def index():
    target = np.array([request.json["x"], request.json["y"]])
    global is_moving
    while is_moving and np.linalg.norm(target - position) > 0.1:
        movement = target - position
        max_speed = 0.2
        if np.linalg.norm(movement) > max_speed:
            movement = movement / np.linalg.norm(movement) * max_speed
        ep_chassis.drive_speed(
            x=movement[0],
            y=-movement[1],
            z=0.0,
        )
        sleep(0.1)
    #is_moving = True
    return "OK"


@app.route("/speed", methods=["POST"])
def speed():
    command = np.array(
        [request.json["x"], request.json["y"], request.json["z"]])
    ep_chassis.drive_speed(
        x=command[0],
        y=-command[1],
        z=command[2],
    )
    return "OK"


@app.route("/stop", methods=["GET"])
def stop():
    global is_moving
    is_moving = False
    sleep(0.1)
    ep_robot.led.set_led(comp="all", r=255, g=0, b=0)
    ep_chassis.drive_speed(x=0, y=0, z=0.0)
    return "OK"


@app.route("/alarm", methods=["GET"])
def alarm():
    global is_moving
    ep_robot.play_audio(filename="alarm2.wav").wait_for_completed()
    return "OK"


@app.route("/wait", methods=["GET"])
def wait():
    return "OK"


ep_robot = robot.Robot()
ep_robot.initialize(conn_type="sta")
print(f"Robot Version: {ep_robot.get_version()}")
ep_robot.led.set_led(comp="all", r=0, g=255, b=0)
ep_chassis = ep_robot.chassis
ep_chassis.sub_position(freq=10, callback=sub_position_handler)
app.run(debug=True, host='0.0.0.0', port=1337)
ep_robot.close()
