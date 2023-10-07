import influxdb_client
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
    x, y, _ = position_info
    print(position_info)
    position = [x, -y]
    point = influxdb_client.Point("robot_position").field("x",
                                                          x).field("y", -y)
    write_api.write(bucket=bucket, org="draeger", record=point)


app = Flask(__name__)


@app.route("/", methods=["POST"])
def index():
    # example: { "translation": { "x": 42.123, "y": 42.1337 }, "rotation": 0.5 }
    target = np.array([request.json["x"], request.json["y"]])
    movement = target - position
    ep_chassis.move(
        x=movement[0],
        y=-movement[1],
        z=0.0,
        xy_speed=0.7,
        #z=-request.json["rotation"]*180/math.pi,  # TODO: convert angle from radians to degree
    ).wait_for_completed()
    return "OK"


ep_robot = robot.Robot()
ep_robot.initialize(conn_type="sta")
print(f"Robot Version: {ep_robot.get_version()}")
ep_chassis = ep_robot.chassis
ep_chassis.sub_position(freq=10, callback=sub_position_handler)
app.run(debug=True, host='0.0.0.0', port=1337)
ep_robot.close()
