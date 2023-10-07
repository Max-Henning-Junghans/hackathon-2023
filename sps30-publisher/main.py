import os

import influxdb_client
from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS
from sps30 import SPS30

token = "0mQM1AAcncsU-9T_tmTdXZdoqfAmbIJlFV04DOr_emc_DxeriyKovlzN7x7vf1RwYuVEqDS_x7kSxVwWL-AoNg=="
org = "draeger"
url = "http://10.130.1.221:8086"

client = influxdb_client.InfluxDBClient(url=url, token=token, org=org)

bucket = "robomaster"

write_api = client.write_api(write_options=SYNCHRONOUS)

device = os.environ["SERIAL_DEVICE"] or "/dev/ttyUSB0"
sensor = SPS30(device)
sensor.start_measurement()

while True:
    measurements = sensor.read_measured_values()
    point = Point("sps30")\
            .field("mass_pm1", measurements.mass_pm1)\
            .field("mass_pm25", measurements.mass_pm25)\
            .field("mass_pm4", measurements.mass_pm4)\
            .field("mass_pm10", measurements.mass_pm10)\
            .field("number_pm05", measurements.number_pm05)\
            .field("number_pm1", measurements.number_pm1)\
            .field("number_pm25", measurements.number_pm25)\
            .field("number_pm4", measurements.number_pm4)\
            .field("number_pm10", measurements.number_pm10)\
            .field("typical_size", measurements.typical_size)
    write_api.write(bucket=bucket, org="draeger", record=point)
