// Import Mapbox as an ESM module
import mapboxgl from 'https://cdn.jsdelivr.net/npm/mapbox-gl@2.15.0/+esm';
// Import d3 as an ESM module
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

function getCoords(station) {
    const point = new mapboxgl.LngLat(+station.lon, +station.lat); // Convert lon/lat to Mapbox LngLat
    const {x, y} = map.project(point);  // Project to pixel coordinates
    return { cx: x, cy: y}; // Return as object for use in SVG attritbutes
}


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

    // adding bike station
    // adding bike traffic
    let jsonData;
        try {
            const jsonurl = "https://dsc106.com/labs/lab07/data/bluebikes-stations.json";

            // Await JSON fetch
            const jsonData = await d3.json(jsonurl);

            let stations = jsonData.data.stations;

            const svg = d3.select('#map').select('svg');

            // append circles to the SVG for each station
            const circles = svg.selectAll('circle')
                                    .data(stations)
                                    .enter()
                                    .append('circle')
                                    .attr('r', 5)
                                    .attr('fill', 'steelblue')
                                    .attr('stroke', 'white')
                                    .attr('stroke-width', 1)
                                    .attr('opacity', 0.6);
            
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


            // adding bike traffic
            const trips = await d3.csv('https://dsc106.com/labs/lab07/data/bluebikes-traffic-2024-03.csv');
            const departures = d3.rollup(
                trips,
                (v) => v.length,
                (d) => d.start_station_id,
            );

            const arrivals = d3.rollup(
                trips,
                (v) => v.length,
                (d) => d.end_station_id,
            );

            stations = stations.map((station) => {
                let id = station.short_name;
                station.arrivals = arrivals.get(id) ?? 0;
                station.departures = departures.get(id) ?? 0;
                station.totalTraffic = station.arrivals + station.departures;

                return station;
            });

            const radiusScale = d3
                                .scaleSqrt()
                                .domain([0, d3.max(stations, (d) => d.totalTraffic)])
                                .range([0,25]);

            // set radius respect to traffic
            circles.attr('r', d => radiusScale(d.totalTraffic))
                   .each(function(d) {  // create tooltip
                        // Add <title> for browser tooltips
                        d3.select(this)
                          .append('title')
                          .text(`${d.totalTraffic} trips (${d.departures} departures, ${d.arrivals} arrivals)`);
                   });
            
        } catch (error) {
            console.error('Error loading JSON:', error);    // Handle erros
        }


    
})


