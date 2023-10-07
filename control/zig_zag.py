import requests
import influxdb_client
from time import sleep
from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS



def drive(target):
    print(f"Driving to {target}")
    url = "http://127.0.0.1:5000/"
    payload = {"x": target[0], "y": target[1]}
    requests.post(url, json=payload)


if __name__ == "__main__":

    # solange ein Anstieg der Konzentration festgestellt wird fahre weiter,
    # sinkt die Konzentration fahre ein Kreismuster

    token = "1LIAK2SfvBun7WqqldPvjDoQjeuFJm7kLp8rY_dzLAhpzyb9QRrEGoiLdevXrXaVJUSm8aEcih9B1dAnf833qw=="
    org = "draeger"
    url = "http://10.130.1.221:8086"

    client = influxdb_client.InfluxDBClient(url=url, token=token, org=org)
    query_api = client.query_api()
    query = """
        from(bucket: "robomaster")
        |> range(start: -10s)
        |> filter(fn: (r) => r["_measurement"] == "sps30" and r["_field"] == "mass_pm25")
        |> keep(columns: ["_time", "_field", "_value"])
        |> last()
    """

    state = "measure"
    mode = "left-right"
    side = "high"
    i = 0
    running_value = 0

    while True:
        if state == "measure":    
            
            measurement = query_api.query(query, org="draeger")
            print(measurement)
            if mode == "left-right":
                i = (i + 1)
                if i == 10:
                    mode = "up-down"
                    continue
                if side == "low":
                    drive((i / 10.0, 0))
                    side = "high"
                else:
                    drive((i / 10.0, 9 / 10.0))
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
                    drive((9 / 10.0, i / 10.0))
                    side = "low"
        while state == "alert":
            pass 