import React, { useEffect, useMemo, useState } from "react";
import { InfluxDB } from "@influxdata/influxdb-client";

const MINIMUM_X = -0.3;
const MINIMUM_Y = -0.3;
const MAXIMUM_X = 2.3;
const MAXIMUM_Y = 2.3;

const MINIMUM_INTENSITY = 0;
const MAXIMUM_INTENSITY = 100;

const TIME_SPAN = "-600s";
const TIME_SPAN_TRAIL_SECONDS = 30;

const GRID_SIZE = 0.2;
const CIRCLE_FACTOR = 0.1;

const XZONES = {
  "ARHE-0129": { x: 2, y: 0 },
  "ARJF-0036": { x: 0, y: 2 },
};
const XZONE_SIZE = 0.15;

const TOKEN =
  "3zK40TmVz0-kpnise5PejCO40GhgIxFKcAORGB2hnjbNHXjwqgC9FvxcmDFjdq-asdPoZurO02n9mTp-1jJZCA==";
const URL = "http://localhost:3000";
const ORG = "draeger";

function transformPosition(x, y) {
  return [y, x];
}

function Map() {
  const api = useMemo(() => new InfluxDB({ url: URL, token: TOKEN }), []);

  const [positions, setPositions] = useState({});
  const [intensities, setIntensities] = useState({});
  const [xzoneIntensities, setXzoneIntensities] = useState({});

  const sortedTimes = useMemo(
    () =>
      Object.keys(positions).toSorted(
        (left, right) => Date.parse(left) - Date.parse(right)
      ),
    [positions]
  );
  const trailPositions = useMemo(() => {
    const trailTimes = sortedTimes.filter(
      (time) => Date.parse(time) >= Date.now() - TIME_SPAN_TRAIL_SECONDS * 1000
    );
    return trailTimes.map((time) => {
      const [transformedX, transformedY] = transformPosition(
        positions[time].x,
        positions[time].y
      );
      return {
        time,
        x: transformedX,
        y: transformedY,
      };
    });
  }, [positions, sortedTimes]);
  const heatMapCells = useMemo(() => {
    const cells = {};
    for (const time of sortedTimes.toReversed()) {
      const [transformedX, transformedY] = transformPosition(
        positions[time].x,
        positions[time].y
      );
      const cellX = Math.floor(transformedX * (1 / GRID_SIZE) + 0.5);
      const cellY = Math.floor(transformedY * (1 / GRID_SIZE) + 0.5);
      const cellIndex = `${cellX}:${cellY}`;
      if (cells[cellIndex] === undefined) {
        cells[cellIndex] = intensities[time];
      }
    }
    return Object.entries(cells)
      .filter(([_cellIndex, intensity]) => intensity !== undefined)
      .map(([cellIndex, intensity]) => {
        const [cellX, cellY] = cellIndex.split(":");
        return { x: cellX, y: cellY, intensity };
      });
  }, [positions, intensities, sortedTimes]);

  useEffect(() => {
    const interval = setInterval(() => {
      const queryApi = api.getQueryApi(ORG);
      const positionsQuery = `
        from(bucket: "robomaster")
          |> range(start: ${TIME_SPAN})
          |> filter(fn: (r) => r["_measurement"] == "robot_position")
          |> filter(fn: (r) => r["_field"] == "x" or r["_field"] == "y")
          |> aggregateWindow(every: 1s, fn: mean, createEmpty: false)
          |> keep(columns: ["_time", "_field", "_value"])
          |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
          |> group()
      `;
      const intensitiesQuery = `
        from(bucket: "robomaster")
          |> range(start: ${TIME_SPAN})
          |> filter(fn: (r) => r["_measurement"] == "sps30")
          |> filter(fn: (r) => r["_field"] == "mass_pm10")
          |> filter(fn: (r) => r["device"] == "/dev/ttyUSB0")
          |> aggregateWindow(every: 1s, fn: mean, createEmpty: false)
          |> keep(columns: ["_time", "_field", "_value"])
          |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
          |> group()
      `;
      const xzoneQuery = `
        from(bucket: "robomaster")
        |> range(start: 0)
        |> filter(fn: (r) => r["_measurement"] == "xzone")
        |> filter(fn: (r) => r["_field"] == "CO2VOL") // maybe delete them to get all values?
        |> last()
      `;
      const positionsData = {};
      queryApi.queryRows(positionsQuery, {
        next: (row, tableMeta) => {
          const tableObject = tableMeta.toObject(row);
          positionsData[tableObject._time] = {
            x: tableObject.x,
            y: tableObject.y,
          };
        },
        error: (error) => {
          console.error("Error", error);
        },
        complete: () => {
          setPositions(positionsData);
        },
      });
      const intensitiesData = {};
      queryApi.queryRows(intensitiesQuery, {
        next: (row, tableMeta) => {
          const tableObject = tableMeta.toObject(row);
          intensitiesData[tableObject._time] = Math.max(
            0,
            Math.min(
              1,
              (tableObject.mass_pm10 - MINIMUM_INTENSITY) /
                (MAXIMUM_INTENSITY - MINIMUM_INTENSITY)
            )
          );
        },
        error: (error) => {
          console.error("Error", error);
        },
        complete: () => {
          setIntensities(intensitiesData);
        },
      });
      const collectedXzoneIntensities = {};
      queryApi.queryRows(xzoneQuery, {
        next: (row, tableMeta) => {
          const tableObject = tableMeta.toObject(row);
          collectedXzoneIntensities[tableObject.serial] = tableObject._value;
        },
        error: (error) => {
          console.error("Error", error);
        },
        complete: () => {
          setXzoneIntensities(collectedXzoneIntensities);
        },
      });
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [api]);

  const xzones = Object.entries(XZONES).map(([name, { x, y }]) => (
    <>
      <circle
        r={xzoneIntensities[name]}
        cx={x}
        cy={y}
        fill="rgba(0, 30, 186, 0.25)"
      />
      <image
        x={x - XZONE_SIZE / 2}
        y={y - XZONE_SIZE / 2}
        width={XZONE_SIZE}
        height={XZONE_SIZE}
        href="r2d2.webp"
      />
    </>
  ));

  const numberOfSegments = trailPositions.length;
  const pathPoints = trailPositions.map(({ time, x, y }, index) => (
    <circle
      key={index}
      r={intensities[time] * CIRCLE_FACTOR}
      cx={x}
      cy={y}
      fill="rgba(0, 30, 186, 0.25)"
    />
  ));
  const [_, pathLines] = trailPositions.reduce(
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
                strokeLinecap="round"
              />,
            ],
          ],
    [null, []]
  );
  const gridCellElements = heatMapCells.map(({ x, y, intensity }, index) => (
    <rect
      key={index}
      x={x * GRID_SIZE - GRID_SIZE / 2}
      y={y * GRID_SIZE - GRID_SIZE / 2}
      width={GRID_SIZE}
      height={GRID_SIZE}
      fill={`rgba(0, 30, 186, ${intensity * 0.5})`}
    />
  ));
  const robotPosition = trailPositions[trailPositions.length - 1];
  const robotImage = robotPosition && (
    <image
      x={robotPosition.x - XZONE_SIZE / 2}
      y={robotPosition.y - XZONE_SIZE / 2}
      width={XZONE_SIZE}
      height={XZONE_SIZE}
      href="robot.png"
    />
  );
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
      {xzones}
      {robotImage}
    </svg>
  );
}

export default Map;
