import React, { useEffect, useMemo, useState } from "react";
import { InfluxDB } from "@influxdata/influxdb-client";

const MINIMUM_X = -2;
const MINIMUM_Y = -2;
const MAXIMUM_X = 2;
const MAXIMUM_Y = 2;

const TOKEN =
  "3zK40TmVz0-kpnise5PejCO40GhgIxFKcAORGB2hnjbNHXjwqgC9FvxcmDFjdq-asdPoZurO02n9mTp-1jJZCA==";
const URL = "http://localhost:3000";
const ORG = "draeger";

// historie an positionen
// sensorwert historie an position
const POSITIONS_WITH_SENSOR_INTENSITIES = [
  { x: -1, y: -1, intensity: 0.5 },
  { x: -0.5, y: -1, intensity: 0.6 },
  { x: 0, y: -1, intensity: 0.7 },
  { x: 0.5, y: -1, intensity: 0.8 },
  { x: 1, y: -1, intensity: 0.9 },
  { x: 1, y: -0.5, intensity: 1 },
  { x: 1, y: 0, intensity: 0.3 },
  { x: 1, y: 0.5, intensity: 0.2 },
  { x: 1, y: 1, intensity: 0.1 },
];

function Map(props) {
  const api = useMemo(() => new InfluxDB({ url: URL, token: TOKEN }));

  const [positionsWithIntensities, setPositionsWithIntensities] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const queryApi = api.getQueryApi(ORG);
      const timeSpan = "-60s";
      const query = `import "join"
      positions =
        from(bucket: "robomaster")
          |> range(start: ${timeSpan})
          |> filter(fn: (r) => r["_measurement"] == "simulated_robot")
          |> filter(fn: (r) => r["_field"] == "x" or r["_field"] == "y")
          |> aggregateWindow(every: 1s, fn: mean, createEmpty: false)
          |> keep(columns: ["_time", "_field", "_value"])
          |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
          |> group()
  
      sensor_values = 
        from(bucket: "robomaster")
          |> range(start: ${timeSpan})
          |> filter(fn: (r) => r["_measurement"] == "sps30")
          |> filter(fn: (r) => r["_field"] == "mass_pm10")
          |> filter(fn: (r) => r["device"] == "/dev/ttyUSB0")
          |> aggregateWindow(every: 1s, fn: mean, createEmpty: false)
          |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
          |> group()
  
      join.time(
          left: positions,
          right: sensor_values,
          as: (l, r) => (
              {
                  l with
                  mass_pm10: r.mass_pm10
              }),
          method: "inner"
      )
      |> sort(columns: ["_time"])`;
      const rows = [];
      queryApi.queryRows(query, {
        next: (row, tableMeta) => {
          const tableObject = tableMeta.toObject(row);
          rows.push({
            time: tableObject._time,
            x: tableObject.x,
            y: tableObject.y,
            intensity: tableObject.mass_pm10 / 5,
          });
        },
        error: (error) => {
          console.error("Error", error);
        },
        complete: () => {
          setPositionsWithIntensities(rows);
        },
      });
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [api]);

  const numberOfSegments = positionsWithIntensities.length;
  const pathPoints = positionsWithIntensities.map(
    ({ x, y, intensity }, index) => (
      <circle
        key={index}
        r="0.05"
        cx={x}
        cy={y}
        fill={`rgba(${intensity * 255}, 0, ${(1 - intensity) * 255}, ${
          (index + 1) / numberOfSegments
        })`}
      />
    )
  );
  const [_, pathLines] = positionsWithIntensities.reduce(
    ([previous, pathLines], current, index) =>
      previous === null
        ? [current, pathLines]
        : [
            current,
            [
              ...pathLines,
              <line
                key={index}
                x1={previous.x}
                y1={previous.y}
                x2={current.x}
                y2={current.y}
                fill="none"
                stroke={`rgba(0, 0, 0, ${index / numberOfSegments})`}
                strokeWidth="0.01"
              />,
            ],
          ],
    [null, []]
  );
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`${MINIMUM_X} ${MINIMUM_Y} ${MAXIMUM_X - MINIMUM_X} ${
        MAXIMUM_Y - MINIMUM_Y
      }`}
    >
      {pathLines}
      {pathPoints}
    </svg>
  );
}

export default Map;
