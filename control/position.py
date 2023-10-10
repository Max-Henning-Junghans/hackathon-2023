from robomaster import robot
import robomaster
from time import sleep


def sub_position_handler(position_info):
    print(position_info)


ep_robot = robot.Robot()
ep_robot.initialize(conn_type="sta")
print(f"Robot Version: {ep_robot.get_version()}")
ep_chassis = ep_robot.chassis
robot_mode = ep_robot.get_robot_mode()
print(robot_mode)
ep_chassis.sub_position(freq=10, callback=sub_position_handler)
sleep(100)
