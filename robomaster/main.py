from flask import Flask, request
from time import sleep
from robomaster import robot
import math

import influxdb_client, os, time
from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS

token = os.environ.get("INFLUXDB_TOKEN")
org = "draeger"
url = "http://10.130.1.221:8086"

client = influxdb_client.InfluxDBClient(url=url, token=token, org=org)
bucket="robomaster"

write_api = client.write_api(write_options=SYNCHRONOUS)

app = Flask(__name__)

ep_robot = robot.Robot()
ep_robot.initialize(conn_type="rndis")

def sub_position_handler(position_info):
    try:
        x, y, angle = position_info
        print(position_info)
        point = influxdb_client.Point("position").field("x", x).field("y", -y).field("rotation", -angle*math.pi/180) # TODO: convert angle from degree to radians
        write_api.write(bucket=bucket, org="draeger", record=point)
    except Exception:
        import traceback
        traceback.print_exc()

ep_chassis = ep_robot.chassis
ep_chassis.sub_position(freq=1, callback=sub_position_handler)



@app.route("/", methods=["POST"])
def index():
    # example: { "translation": { "x": 42.123, "y": 42.1337 }, "rotation": 0.5 }
    ep_chassis.move(
        x=request.json["translation"]["x"],
        y=-request.json["translation"]["y"],
        z=-request.json["rotation"]*180/math.pi,  # TODO: convert angle from radians to degree
    )
    return ""

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
    ep_chassis.unsub_position()
    ep_robot.close()

# from time import sleep
# from robomaster import robot

# def ir_hit_detection_event(msg):
#     print(msg)

# ep_robot = robot.Robot()
# ep_robot.initialize(conn_type="rndis")
# print(ep_robot)
# # print(ep_robot.armor.sub_hit_event(lambda armor_id, hit_type: print(armor_id, hit_type)))
# print(ep_robot.camera.video_stream_addr)
# ep_robot.camera.start_video_stream()
# sleep(30)
# # ep_robot.camera.stop_video_stream()
# ep_robot.close()
