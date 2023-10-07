import requests
from time import sleep


def drive(target):
    print(f"Driving to {target}")
    url = "http://127.0.0.1:1337/"
    payload = {"x": target[0], "y": target[1]}
    requests.post(url, json=payload)


if __name__ == "__main__":
    mode = "left-right"
    side = "high"
    i = 0
    while True:
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
