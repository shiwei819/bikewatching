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
map.on('load',() => {
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
    const svg = d3.select('#map').select('svg');
    let stations = [];

    // Load the nested JSON file
    const jsonurl = "https://dsc106.com/labs/lab07/data/bluebikes-stations.json"
    d3.json(jsonurl).then(jsonData => {
        // console.log('Loaded JSON Data:', jsonData);  // Log to verify structure
        stations = jsonData.data.stations;
        // console.log('Stations Array:', stations);

        function getCoords(station) {
            const point = new mapboxgl.LngLat(+station.lon, +station.lat); // Convert lon/lat to Mapbox LngLat
            const {x, y} = map.project(point);  // Project to pixel coordinates
            return { cx: x, cy: y}; // Return as object for use in SVG attritbutes
        }

        // append circles to the SVG for each station
        const circles = svg.selectAll('circle')
                            .data(stations)
                            .enter()
                            .append('circle')
                            .attr('r', 5)
                            .attr('fill', 'steelblue')
                            .attr('stroke', 'white')
                            .attr('stroke-width', 1)
                            .attr('opacity', 0.8);

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
        
    }).catch(error => {
        console.error('Error loading JSON:', error);  // Handle errors if JSON loading fails
    });
})


