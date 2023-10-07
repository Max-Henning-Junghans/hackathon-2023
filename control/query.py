import influxdb_client
import matplotlib.pyplot as plt
import numpy as np
from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS

token = "1LIAK2SfvBun7WqqldPvjDoQjeuFJm7kLp8rY_dzLAhpzyb9QRrEGoiLdevXrXaVJUSm8aEcih9B1dAnf833qw=="
org = "draeger"
url = "http://10.130.1.221:8086"

client = influxdb_client.InfluxDBClient(url=url, token=token, org=org)
query_api = client.query_api()
time_span = "-30s"
grid_resolution = 0.01
query = """
import "join"
values =
    from(bucket: "robomaster")
    |> range(start: -10s)
    |> filter(fn: (r) => r["_measurement"] == "simulated_robot" or r["_measurement"] == "sps30")
    |> aggregateWindow(every: 1s, fn: mean, createEmpty: false)
    |> keep(columns: ["_time", "_field", "_value"])
    |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
    |> yield(name: "measurements")
    |> map(fn: (r) => ({
        r with
        grid_x: int(v: r.x * 10.0),
        grid_y: int(v: r.y * 10.0)
    }))
    |> group(columns: ["grid_x", "grid_y"])
    |> mean()
    |> yield(name: "heatmap")
  """
tables = query_api.query(query, org="draeger")

for table in tables:
    print("\nTABLE")
    for record in table.records:
        print("RECORD")
        print(record.values)

exit()

while True:
    tables = query_api.query(query, org="draeger")

    heat_map = np.zeros((101, 101))

    for table in tables:
        for record in table.records:
            x = record["grid_x"]
            y = record["grid_y"]
            heat_map[x, y] = record["mass_pm10"]

    plt.imshow(heat_map, origin="lower")
    plt.pause(1.0)
