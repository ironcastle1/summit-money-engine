import { EARTH_RADIUS_KM } from './constants.js';
import { coordinate } from './coordinate.js';
const radians = value => Number(value) * Math.PI / 180;
const degrees = value => Number(value) * 180 / Math.PI;
export function destinationPoint(origin, distanceKm, bearingDegrees) {
    const angular = Number(distanceKm) / EARTH_RADIUS_KM;
    const bearing = radians(bearingDegrees);
    const latitude1 = radians(origin.lat);
    const longitude1 = radians(origin.lon);
    const latitude2 = Math.asin(Math.sin(latitude1) * Math.cos(angular) + Math.cos(latitude1) * Math.sin(angular) * Math.cos(bearing));
    const longitude2 = longitude1 + Math.atan2(Math.sin(bearing) * Math.sin(angular) * Math.cos(latitude1), Math.cos(angular) - Math.sin(latitude1) * Math.sin(latitude2));
    return coordinate(degrees(latitude2), degrees(longitude2), { mercator: false });
}
