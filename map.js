// Mapbox token
mapboxgl.accessToken = 'pk.eyJ1IjoibWl6dWhhc2hpIiwiYSI6ImNtN2VudmJrcjBmbGUya29kMHBlN2czamYifQ.H_0LJWlI31kLZzRcIRUF_g';

// Initialize map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mizuhashi/cm7eovrzi00b401so5o4m8z98',
    center: [-71.09415, 42.36027], // [longitude, latitude]
    zoom: 12, // Initial zoom level
    minZoom: 5, // Minimum allowed zoom
    maxZoom: 18 // Maximum allowed zoom
});