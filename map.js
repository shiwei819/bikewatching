// Import Mapbox as an ESM module
import mapboxgl from 'https://cdn.jsdelivr.net/npm/mapbox-gl@2.15.0/+esm';
// Import d3 as an ESM module
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// helper function helps to get station location on map
function getCoords(station) {
    const point = new mapboxgl.LngLat(+station.lon, +station.lat); // Convert lon/lat to Mapbox LngLat
    const {x, y} = map.project(point);  // Project to pixel coordinates
    return { cx: x, cy: y}; // Return as object for use in SVG attritbutes
}

// helper function to format time
function formatTime(minutes) {
    const date = new Date(0, 0, 0, 0, minutes); // Set hours & minutes
    return date.toLocaleString('en-US', { timeStyle: 'short'}); // Format as HH:MM AM/PM
}

// helper function to calculate traffic ----- ----- abandoned
// function computeStationTraffic(stations, trips) {
//     // Compute departures
//     const departures = d3.rollup(
//         trips,
//         (v) => v.length,
//         (d) => d.start_station_id
//     );

//     // Computed arrivals
//     const arrivals = d3.rollup(
//         trips,
//         (v) => v.length,
//         (d) => d.end_station_id
//     );

//     // Update each station
//     return stations.map((station) => {
//         let id = station.short_name;
//         station.arrivals = arrivals.get(id) ?? 0;
//         station.departures = departures.get(id) ?? 0;
//         station.totalTraffic = station.arrivals + station.departures

//         return station;
//     });
// }

// helper function to calculate traffic ----- ----- Updated
function computeStationTraffic(stations, timeFilter = -1) {
    // Retrieve filtered trips efficiently
    const departures = d3.rollup(
        filterByMinute(departuresByMinute, timeFilter),
        (v) => v.length,
        (d) => d.start_station_id
    );

    const arrivals = d3.rollup(
        filterByMinute(arrivalsByMinute, timeFilter),
        (v) => v.length,
        (d) => d.end_station_id
    );

    // Update each station
    return stations.map((station) => {
        let id = station.short_name;
        station.arrivals = arrivals.get(id) ?? 0;
        station.departures = departures.get(id) ?? 0;
        station.totalTraffic = station.arrivals + station.departures

        return station;
    });
}

// helper function to convert date to hours and minutes
function minutesSinceMidnight(date) {
    return date.getHours() * 60 + date.getMinutes();
}

// helper function  abandoned,  ----    -----   now use filtetByMinute()
// function filterTripsbyTime(trips, timeFilter) {
//     return timeFilter === -1 
//         ? trips // If no filter is applied (-1), return all trips
//         : trips.filter((trip) => {
//             // Convert trip start and end times to minutes since midnight
//             const startedMinutes = minutesSinceMidnight(trip.started_at);
//             const endedMinutes = minutesSinceMidnight(trip.ended_at);

//             // Includes trips that stated or ended within 60 minutes of the selected time
//             return (
//                 Math.abs(startedMinutes - timeFilter) <= 60 ||
//                 Math.abs(endedMinutes - timeFilter) < 60
//             );
//         });
// }

function filterByMinute(tripsByMinute, minute) {
    if (minute === -1 ) {
        return tripsByMinute.flat();    // No filtering, return all trips
    }

    // Normalize both min and max minutes to the valid range [0, 1439]
    let minMinute = (minute - 60 + 1440) % 1440;
    let maxMinute = (minute + 60) % 1440;

    // Handle time filtering across midnight
    if (minMinute > maxMinute) {
        let beforeMidnight = tripsByMinute.slice(minMinute);
        let afterMidnight = tripsByMinute.slice(0, maxMinute);
        return beforeMidnight.concat(afterMidnight).flat();
    } else {
        return tripsByMinute.slice(minMinute, maxMinute).flat();
    }
}

let timeFilter = -1;

// helper array for storing blocks of data to quickly filter
let departuresByMinute = Array.from({ length: 1440 }, () => []);
let arrivalsByMinute = Array.from({ length: 1440 }, () => []);

// Mapbox token
mapboxgl.accessToken = 'pk.eyJ1IjoibWl6dWhhc2hpIiwiYSI6ImNtN2VudmJrcjBmbGUya29kMHBlN2czamYifQ.H_0LJWlI31kLZzRcIRUF_g';

// Initialize map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    center: [-71.09415, 42.36027], // [longitude, latitude]
    zoom: 12, // Initial zoom level
    minZoom: 5, // Minimum allowed zoom
    maxZoom: 18 // Maximum allowed zoom
});

// draw bike lines
map.on('load', async () => {
    // add Boston bike lines
    map.addSource('boston_route', {
        type: 'geojson',
        data: 'https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson?...'
    });

    map.addLayer({
        id: 'bike-lanes_boston',
        type: 'line',
        source: 'boston_route',
        paint: {
            'line-color': '#32D400',  // A bright green using hex code
            'line-width': 5,          // Thicker lines
            'line-opacity': 0.6       // Slightly less transparent
        }
    });

    // add cambridge bike lines
    map.addSource('cambridge_route', {
        type: 'geojson',
        data: 'https://raw.githubusercontent.com/cambridgegis/cambridgegis_data/main/Recreation/Bike_Facilities/RECREATION_BikeFacilities.geojson'
    });

    map.addLayer({
        id: 'bike-lanes_cambridge',
        type: 'line',
        source: 'cambridge_route',
        paint: {
            'line-color': '#32D400',  // A bright green using hex code
            'line-width': 5,          // Thicker lines
            'line-opacity': 0.6       // Slightly less transparent
        }
    });

    // adding bike station      Old code
    // adding bike traffic
    // try {
    //     const jsonurl = "https://dsc106.com/labs/lab07/data/bluebikes-stations.json";

    //     // Await JSON fetch
    //     const jsonData = await d3.json(jsonurl);

    //     let stations = jsonData.data.stations;

    //     const svg = d3.select('#map').select('svg');

    //     // append circles to the SVG for each station
    //     const circles = svg.selectAll('circle')
    //                             .data(stations, (d) => d.short_name)    //  Use station short_name as the key
    //                             .enter()
    //                             .append('circle')
    //                             .attr('r', 5)
    //                             .attr('fill', 'steelblue')
    //                             .attr('stroke', 'white')
    //                             .attr('stroke-width', 1)
    //                             .attr('opacity', 0.6);
        
    //     // Function to update circle positions when the map moves/zooms
    //     function updatePositions() {

    //         circles
    //             .attr('cx', d => getCoords(d).cx)  // Set the x-position using projected coordinates
    //             .attr('cy', d => getCoords(d).cy); // Set the y-position using projected coordinates
    //     }

    //     // Initial position update when map loads                    
    //     updatePositions();

    //     // Reposition markers on map interactions
    //     map.on('move', updatePositions);     // Update during map movement
    //     map.on('zoom', updatePositions);     // Update during zooming
    //     map.on('resize', updatePositions);   // Update on window resize
    //     map.on('moveend', updatePositions);  // Final adjustment after movement ends


    //     // adding bike traffic
    //     const trips = await d3.csv(
    //         'https://dsc106.com/labs/lab07/data/bluebikes-traffic-2024-03.csv',
    //         (trip) => {
    //             trip.started_at = new Date(trip.started_at);
    //             trip.ended_at = new Date(trip.ended_at);
    //             return trip;
    //         },
    //     );

    //     const departures = d3.rollup(
    //         trips,
    //         (v) => v.length,
    //         (d) => d.start_station_id,
    //     );

    //     const arrivals = d3.rollup(
    //         trips,
    //         (v) => v.length,
    //         (d) => d.end_station_id,
    //     );

    //     stations = stations.map((station) => {
    //         let id = station.short_name;
    //         station.arrivals = arrivals.get(id) ?? 0;
    //         station.departures = departures.get(id) ?? 0;
    //         station.totalTraffic = station.arrivals + station.departures;

    //         return station;
    //     });

    //     const radiusScale = d3
    //                         .scaleSqrt()
    //                         .domain([0, d3.max(stations, (d) => d.totalTraffic)])
    //                         .range([0,25]);

    //     // set radius respect to traffic
    //     circles.attr('r', d => radiusScale(d.totalTraffic))
    //             .each(function(d) {  // create tooltip
    //                 // Add <title> for browser tooltips
    //                 d3.select(this)
    //                     .append('title')
    //                     .text(`${d.totalTraffic} trips (${d.departures} departures, ${d.arrivals} arrivals)`);
    //             });
        
    // } catch (error) {
    //     console.error('Error loading JSON:', error);    // Handle erros
    // }

    // adding bike station      Updated code
    // adding bike traffic
    // try{

    //  vvvvvvvvvvvvvvvvvvvvvv NEW vvvvvvvvvvvvvvvvvvvvv    try&catch removed
    const jsonurl = "https://dsc106.com/labs/lab07/data/bluebikes-stations.json";
    const jsonData = await d3.json(jsonurl);
    const trips = await d3.csv(
        'https://dsc106.com/labs/lab07/data/bluebikes-traffic-2024-03.csv',
        (trip) => {
            trip.started_at = new Date(trip.started_at);
            trip.ended_at = new Date(trip.ended_at);

            // push to departure,arrival array for later quick filter
            //This function returns how many minutes have passed since `00:00` (midnight).
            let startedMinutes = minutesSinceMidnight(trip.started_at);
            //This adds the trip to the correct index in `departuresByMinute` so that later we can efficiently retrieve all trips that started at a specific time.
            departuresByMinute[startedMinutes].push(trip);

            let endedMinutes = minutesSinceMidnight(trip.ended_at);
            arrivalsByMinute[endedMinutes].push(trip);

            return trip;
        },
    );
    const stations = computeStationTraffic(jsonData.data.stations);
    // ^^^^^^^^^^^^^^^^^^^^^^^ NEW ^^^^^^^^^^^^^^^^^^^^^^

    const svg = d3.select('#map').select('svg');

    // define a transformer to convert depature for later coloring
    let stationFlow = d3.scaleQuantize().domain([0,1]).range([0, 0.5, 1]);

    const radiusScale = d3
                        .scaleSqrt()
                        .domain([0, d3.max(stations, (d) => d.totalTraffic)])
                        .range([0,25]);

    // append circles to the SVG for each station
    const circles = svg.selectAll('circle')
                            .data(stations, (d) => d.short_name)    //  Use station short_name as the key
                            .enter()
                            .append('circle')
                            // .attr('r', 5)
                            .attr('r', d => radiusScale(d.totalTraffic))    // set radius respect to traffic
                            .each(function(d) {  // create tooltip
                                // Add <title> for browser tooltips
                                d3.select(this)
                                    .append('title')
                                    .text(`${d.totalTraffic} trips (${d.departures} departures, ${d.arrivals} arrivals)`);
                            })
                            // .attr('fill', 'steelblue')
                            .attr('stroke', 'white')
                            .attr('stroke-width', 1)
                            .attr('opacity', 0.6)
                            .style("--departure-ratio", d => stationFlow(d.departures / d.totalTraffic));
    
    // Function to update circle positions when the map moves/zooms
    function updatePositions() {

        circles
            .attr('cx', d => getCoords(d).cx)  // Set the x-position using projected coordinates
            .attr('cy', d => getCoords(d).cy); // Set the y-position using projected coordinates
    }                        
    // Initial position update when map loads                    
    updatePositions();
    // Reposition markers on map interactions
    map.on('move', updatePositions);     // Update during map movement
    map.on('zoom', updatePositions);     // Update during zooming
    map.on('resize', updatePositions);   // Update on window resize
    map.on('moveend', updatePositions);  // Final adjustment after movement ends

    // } catch (error) {
    //     console.error('Error loading JSON:', error);    // Handle erros
    // }

    // slider filter time
    const timeSlider = document.getElementById('time-slider');
    const selectedTime = document.getElementById('selected-time');
    const anyTimeLabel = document.getElementById('any-time');


    // function update timefilter base on slider's value
    function updateTimeDisplay() {
        timeFilter = Number(timeSlider.value);  //  Get slider value

        if (timeFilter === -1) {
            selectedTime.textContent = '';  // Clear time display
            anyTimeLabel.style.display = 'block';   // Show "(any time)"
        } else {
            selectedTime.textContent = formatTime(timeFilter);  // Display formatted time
            anyTimeLabel.style.display = 'none';    //  Hide "(any time)"
        }

        // Call updateScatterPlot to reflect the changes on the map
        updateScatterPlot(timeFilter);
    }

    // function update circles on map
    function updateScatterPlot(timeFilter) {
        // Get only the trips that match the selected time filter   -------- Abandoned too expensive
        // const filteredTrips = filterTripsbyTime(trips, timeFilter);

        // Recompute station traffic based on the filtered trips    -------- Updated, using timeFilter directly
        const filteredStations = computeStationTraffic(stations, timeFilter);

        // Dynamically control circle size depend on # of filtered trips
        timeFilter === -1 ? radiusScale.range([0,25]) : radiusScale.range([3,50]);

        // Update the scatterplot by adjusting the radius of circles
        circles
            .data(filteredStations, (d) => d.short_name)    // Ensure D3 tracks elements correctly
            .join('circle') //  Ensure the data is bound correctly
            .attr('r', (d) => d.totalTraffic === 0 ? 0 : radiusScale(d.totalTraffic)) // Update circle sizes, Don't draw if totalTraffic is 0
            .each(function(d) {  // create tooltip
                // Update <title> for browser tooltips
                d3.select(this)
                    .select('title')
                    .text(`${d.totalTraffic} trips (${d.departures} departures, ${d.arrivals} arrivals)`);
            })
            .style('--departure-ratio', (d) => stationFlow(d.departures / d.totalTraffic));
    }

    timeSlider.addEventListener('input', updateTimeDisplay);
    updateTimeDisplay();
})


