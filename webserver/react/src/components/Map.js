import React, { useEffect, useMemo, useState } from "react";
import { InfluxDB } from "@influxdata/influxdb-client";

const MINIMUM_X = -0.5;
const MINIMUM_Y = -0.5;
const MAXIMUM_X = 1.5;
const MAXIMUM_Y = 1.5;

const MINIMUM_INTENSITY = 0;
const MAXIMUM_INTENSITY = 25;

const GRID_SIZE = 0.2;

const TOKEN =
  "3zK40TmVz0-kpnise5PejCO40GhgIxFKcAORGB2hnjbNHXjwqgC9FvxcmDFjdq-asdPoZurO02n9mTp-1jJZCA==";
const URL = "http://localhost:3000";
const ORG = "draeger";

function Map() {
  const api = useMemo(() => new InfluxDB({ url: URL, token: TOKEN }));

  const [positionsWithIntensities, setPositionsWithIntensities] = useState([]);
  const [gridCells, setGridCells] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const queryApi = api.getQueryApi(ORG);
      const timeSpan = "-60s";
      const timeSeriesQuery = `
        import "join"
        xs =
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
            left: xs,
            right: sensor_values,
            as: (l, r) => (
                {
                    l with
                    mass_pm10: r.mass_pm10
                }),
            method: "inner"
        )
            |> sort(columns: ["_time"])
      `;
      const heatMapQuery = `
        import "join"
        import "math"
        from(bucket: "robomaster")
        |> range(start: ${timeSpan})
        |> filter(fn: (r) => r["_measurement"] == "robot_position" or r["_measurement"] == "sps30")
        |> filter(fn: (r) => r["_field"] == "x" or r["_field"] == "y" or r["_field"] == "mass_pm10") // maybe delete them to get all values?
        |> aggregateWindow(every: 1s, fn: mean, createEmpty: false)
        |> keep(columns: ["_time", "_field", "_value"])
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
        |> group()
        |> map(fn: (r) => ({
            r with
            grid_x: int(v: r.x * ${(1 / GRID_SIZE).toFixed(4)} + 0.5),
            grid_y: int(v: r.y * ${(1 / GRID_SIZE).toFixed(4)} + 0.5)
        }))
        |> group(columns: ["grid_x", "grid_y"])
        |> last(column: "_time")
        |> group()
      `;
      const timeSeriesRows = [];
      queryApi.queryRows(timeSeriesQuery, {
        next: (row, tableMeta) => {
          const tableObject = tableMeta.toObject(row);
          timeSeriesRows.push({
            time: tableObject._time,
            x: tableObject.x,
            y: tableObject.y,
            intensity: Math.max(
              0,
              Math.min(
                1,
                (tableObject.mass_pm10 - MINIMUM_INTENSITY) /
                  (MAXIMUM_INTENSITY - MINIMUM_INTENSITY)
              )
            ),
          });
        },
        error: (error) => {
          console.error("Error", error);
        },
        complete: () => {
          setPositionsWithIntensities(timeSeriesRows);
        },
      });
      const heatMapRows = [];
      queryApi.queryRows(heatMapQuery, {
        next: (row, tableMeta) => {
          const tableObject = tableMeta.toObject(row);
          heatMapRows.push({
            time: tableObject._time,
            gridX: tableObject.grid_x,
            gridY: tableObject.grid_y,
            intensity: Math.max(
              0,
              Math.min(
                1,
                (tableObject.mass_pm10 - MINIMUM_INTENSITY) /
                  (MAXIMUM_INTENSITY - MINIMUM_INTENSITY)
              )
            ),
          });
        },
        error: (error) => {
          console.error("Error", error);
        },
        complete: () => {
          setGridCells(heatMapRows);
        },
      });
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

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
  const gridCellElements = gridCells.map(({ gridX, gridY, intensity }, index) => (
    <rect
      key={index}
      x={gridX * GRID_SIZE - (GRID_SIZE / 2)}
      y={gridY * GRID_SIZE - (GRID_SIZE / 2)}
      width={GRID_SIZE}
      height={GRID_SIZE}
      fill={`rgba(0, 0, 255, ${intensity})`}
    />
  ));
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`${MINIMUM_X} ${MINIMUM_Y} ${MAXIMUM_X - MINIMUM_X} ${
        MAXIMUM_Y - MINIMUM_Y
      }`}
    >
      {gridCellElements}
      {pathLines}
      {pathPoints}
    </svg>
  );
}

export default Map;
