/*--------------------------------------------------------------------
GGR472 LAB 4: Incorporating GIS Analysis into web maps using Turf.js 
--------------------------------------------------------------------*/

// Mapbox access token
mapboxgl.accessToken =
  "pk.eyJ1IjoiamlhaGFvMjkiLCJhIjoiY2xyNHhudjJsMDFrajJxbWp6ZHlqamR2MyJ9.GLj7pIC0m-_eGRtGH4AJww";

// Initialize map
const map = new mapboxgl.Map({
  container: "map", // container id in HTML
  style: "mapbox://styles/jiahao29/clstm27z5002r01pcaess7gk8", // map style
  center: [-79.39, 43.68], // starting point, longitude/latitude
  zoom: 11, // starting zoom level
});

var collisionData; // empty variable to store the collision data

// Fetch the collision data from the online repository
// store the response in the collisionData variable aftr converting it to JSON format
fetch(
  "https://jiah29.github.io/ggr472_lab4/data/pedcyc_collision_06-21.geojson"
)
  .then((response) => response.json())
  .then((data) => (collisionData = data));

// Global variable to store the maximum number of collisions in a hexagon
var maxCollisions = 0;

// When map is loaded
map.on("load", function () {
  // add scale control
  map.addControl(new mapboxgl.ScaleControl(), "bottom-right");
  // add nav controls
  map.addControl(
    new mapboxgl.NavigationControl({
      visualizePitch: true,
    }),
    "bottom-right"
  );

  // create a bounding box around the collision points, stored as a var
  var bbox = turf.envelope(collisionData);
  // make the bounding box slightly larger by 10%
  var bboxScaled = turf.transformScale(bbox, 1.1);

  // get the min and max coordinates of both axis the bounding box
  var bboxCoords = [
    bboxScaled.geometry.coordinates[0][0][0],
    bboxScaled.geometry.coordinates[0][0][1],
    bboxScaled.geometry.coordinates[0][2][0],
    bboxScaled.geometry.coordinates[0][2][1],
  ];

  // create a hexgrid using the bounding box coordinates
  var hexData = turf.hexGrid(bboxCoords, 0.5, { units: "kilometers" });

  // collect all collisions within each hexagon
  var collisHex = turf.collect(hexData, collisionData, "_id", "values");

  // loop through each hexagon and count the number of collisions
  // then update the maxCollisions variable if the current hexagon has more collisions than found so far
  collisHex.features.forEach((feature) => {
    feature.properties.COUNT = feature.properties.values.length;
    if (feature.properties.COUNT > maxCollisions) {
      maxCollisions = feature.properties.COUNT;
    }
  });

  // add the collision point source
  map.addSource("collisPoints", {
    type: "geojson",
    data: collisionData,
  });

  // add the collision points layer to the map
  map.addLayer({
    id: "collisPointsLayer",
    type: "circle",
    source: "collisPoints",
    paint: {
      "circle-color": [
        // if it's a fatal collision, color it red, otherwise color it yellow
        "match",
        ["get", "ACCLASS"],
        "Fatal",
        "#ff0000",
        "#ffff00",
      ],
      "circle-radius": 5,
      "circle-opacity": 0.7,
    },
    layout: {
      visibility: "none", // set the visibility of the layer to none by default
    },
  });

  // add the hexgrid source to the map
  map.addSource("collisHexGrid", {
    type: "geojson",
    data: collisHex,
  });

  // add the hexgrid layer to the map
  map.addLayer(
    {
      id: "collisHexGrid-Fill",
      type: "fill",
      source: "collisHexGrid",
      paint: {
        // use steps to change the fill color based on the number of collisions
        // max-collisions will be reed, and hexagons with no collisions will be white
        "fill-color": [
          "step",
          ["get", "COUNT"],
          "#ffffff",
          (maxCollisions / 10) * 1,
          "#ffebf1",
          (maxCollisions / 10) * 2,
          "#ffd7e0",
          (maxCollisions / 10) * 3,
          "#ffc5cf",
          (maxCollisions / 10) * 4,
          "#ffb3bb",
          (maxCollisions / 10) * 5,
          "#ffa0a6",
          (maxCollisions / 10) * 6,
          "#ff8c8e",
          (maxCollisions / 10) * 7,
          "#ff7573",
          (maxCollisions / 10) * 8,
          "#ff5a54",
          (maxCollisions / 10) * 9,
          "#ff342e",
          maxCollisions,
          "#ff0000",
        ],
        "fill-opacity": 0.7,
        "fill-outline-color": "rgba(0,0,0,0.3)",
      },
      layout: {
        visibility: "visible", // set the visibility of the layer to visible by default
      },
      // filter out hexagons with no collisions
      filter: ["!=", "COUNT", 0],
    },
    "collisPointsLayer" // add the hexgrid layer below the collision points layer
  );

  // create a legend for the hexgrid when map is loaded since the layer is visible by default
  createHexbinLegend();
});

// Click event listener on collision points layer to
// add a pop-window to show types of victims in each collision point
map.on("click", "collisPointsLayer", (e) => {
  var collisionVictimType = e.features[0].properties.INVTYPE;
  new mapboxgl.Popup()
    .setLngLat(e.lngLat)
    .setHTML("<b>Collision Victim Type:</b> " + collisionVictimType)
    .addTo(map);
});

// Mouse enter event listener on collision poins layer to
// change cursor to pointer when hovering over a collision point
map.on("mouseenter", "collisPointsLayer", () => {
  map.getCanvas().style.cursor = "pointer";
});

// Mouse leave event listener on collision points layer to
// change cursor back to default when not hovering over a collision point
map.on("mouseleave", "collisPointsLayer", () => {
  map.getCanvas().style.cursor = "";
});

// Click event listener on hexbin layer to add a pop-up window to show
// the number of collisions in each hexagon
// (only trigger if collision point layers is not visible)
map.on("click", "collisHexGrid-Fill", (e) => {
  if (map.getLayoutProperty("collisPointsLayer", "visibility") === "none") {
    new mapboxgl.Popup()
      .setLngLat(e.lngLat)
      .setHTML("<b>Number of Collisions:</b> " + e.features[0].properties.COUNT)
      .addTo(map);
  }
});

// Mouse enter event listener on hexbin layer to change cursor to pointer
// when hovering over a hexagon (only trigger if collision point layers is not visible)
map.on("mouseenter", "collisHexGrid-Fill", () => {
  if (map.getLayoutProperty("collisPointsLayer", "visibility") === "none") {
    map.getCanvas().style.cursor = "pointer";
  }
});

// Mouse leave event listener on hexbin layer to change cursor back to default when
// not hovering  over a hexagon (only trigger if collision point layers is not visible)
map.on("mouseleave", "collisHexGrid-Fill", () => {
  if (map.getLayoutProperty("collisPointsLayer", "visibility") === "none") {
    map.getCanvas().style.cursor = "";
  }
});

// Function to toggle the visibility of the hexgrid layer
function toggleHexbin() {
  var visibility = map.getLayoutProperty("collisHexGrid-Fill", "visibility");
  if (visibility === "visible") {
    map.setLayoutProperty("collisHexGrid-Fill", "visibility", "none");
    removeHexbinLegend();
  } else {
    map.setLayoutProperty("collisHexGrid-Fill", "visibility", "visible");
    createHexbinLegend();
  }
}

// Function to toggle the visibility of the collision points layer
function togglePoint() {
  var visibility = map.getLayoutProperty("collisPointsLayer", "visibility");
  if (visibility === "visible") {
    map.setLayoutProperty("collisPointsLayer", "visibility", "none");
    removePointsLegend();
  } else {
    map.setLayoutProperty("collisPointsLayer", "visibility", "visible");
    createPointsLegend();
  }
}

// Helper function to create a legend for the hexgrid
function createHexbinLegend() {
  // get the legend container
  var legend = document.getElementById("legend");
  // make sure the legend container is visible
  legend.style.display = "block";

  // create a div to store the legend item
  var legendItem = document.createElement("div");
  legendItem.id = "hexbinLegend";

  // create a color scale for the legend based on layer styling
  var colors = [
    "#ff0000",
    "#ff342e",
    "#ff5a54",
    "#ff7573",
    "#ff8c8e",
    "#ffa0a6",
    "#ffb3bb",
    "#ffc5cf",
    "#ffd7e0",
    "#ffebf1",
  ];
  // labels for each color, rounding each number down to an integer to avoid decimals in legend
  var labels = [
    maxCollisions,
    Math.floor(maxCollisions * 0.9),
    Math.floor(maxCollisions * 0.8),
    Math.floor(maxCollisions * 0.7),
    Math.floor(maxCollisions * 0.6),
    Math.floor(maxCollisions * 0.5),
    Math.floor(maxCollisions * 0.4),
    Math.floor(maxCollisions * 0.3),
    Math.floor(maxCollisions * 0.2),
    Math.floor(maxCollisions * 0.1),
  ];

  colors.forEach((color, i) => {
    // for each color, create a box with the color and label
    var div = document.createElement("div");

    // basic styling for the color box
    div.style.backgroundColor = color;
    div.style.width = "50px";
    div.style.height = "20px";
    div.style.display = "inline-block"; // make sure that they display next to each other
    div.style.border = "solid 1px rgba(0,0,0,0.3)";

    // the middle colors should not have a border on the left and right
    // to avoid borders overlapping
    div.style.borderLeft = "none";
    div.style.borderRight = "none";

    // add a border to the left and right of the first and last color
    if (i === 0) {
      div.style.borderLeft = "solid 1px rgba(0,0,0,0.3)";
    }
    if (i === colors.length - 1) {
      div.style.borderRight = "solid 1px rgba(0,0,0,0.3)";
    }

    // add the collision number to the color box
    div.textContent = labels[i];
    div.style.textAlign = "center";
    div.style.lineHeight = "20px";
    div.style.fontSize = "12px";

    // adjust position of color box to make it centered against the legend item label
    div.style.position = "relative";
    div.style.top = "-10px";

    // add the color box to the legend item
    legendItem.appendChild(div);
  });

  // create a label for the legend item
  var label = document.createElement("div");
  label.style.fontSize = "15px";
  label.style.marginLeft = "10px";
  label.innerHTML =
    "<b>Number of Collisions in Hexbin</b> <br > (Areas with no hexbins have 0 collision)";
  label.style.display = "inline-block"; // make sure that it displays next to the color boxes

  // add the label to the legend item
  legendItem.appendChild(label);

  // add the legend item to the legend container
  legend.appendChild(legendItem);
}

// Helper function to remove the hexbin legend
function removeHexbinLegend() {
  var legend = document.getElementById("legend");
  var legendItem = document.getElementById("hexbinLegend");
  legend.removeChild(legendItem);

  // if there is no hexbin legend, and there is no collision point legend
  // hide the legend container
  if (legend.childElementCount === 0) {
    legend.style.display = "none";
  }
}

// Helper function to create a legend for the collision points
function createPointsLegend() {
  // get the legend container
  var legend = document.getElementById("legend");
  // make sure the legend container is visible
  legend.style.display = "block";

  // create a div to store the legend item
  var legendItem = document.createElement("div");
  legendItem.id = "collisionPointLegend";

  // create a red circle
  var redCircle = document.createElement("div");
  redCircle.style.backgroundColor = "#ff0000";
  redCircle.style.width = "10px";
  redCircle.style.height = "10px";
  redCircle.style.borderRadius = "50%";
  redCircle.style.display = "inline-block";
  legendItem.appendChild(redCircle);

  // create a label for red circle
  var redLabel = document.createElement("div");
  redLabel.style.fontSize = "15px";
  redLabel.style.marginLeft = "10px";
  redLabel.innerHTML = "<b>Fatal Collision</b>";
  redLabel.style.display = "inline-block";
  redLabel.style.marginRight = "20px";
  legendItem.appendChild(redLabel);

  // create a yellow circle
  var yellowCircle = document.createElement("div");
  yellowCircle.style.backgroundColor = "#ffff00";
  yellowCircle.style.width = "10px";
  yellowCircle.style.height = "10px";
  yellowCircle.style.borderRadius = "50%";
  yellowCircle.style.display = "inline-block";
  legendItem.appendChild(yellowCircle);

  // create a label for yellow circle
  var yellowLabel = document.createElement("div");
  yellowLabel.style.fontSize = "15px";
  yellowLabel.style.marginLeft = "10px";
  yellowLabel.innerHTML = "<b>Non-Fatal Collision</b>";
  yellowLabel.style.display = "inline-block";
  legendItem.appendChild(yellowLabel);

  // add the legend item to the legend container
  // it should be before the hexbin legend if the hexbin legend is present
  legend.insertBefore(legendItem, legend.firstChild);
}

// Helper function to remove the collision points legend
function removePointsLegend() {
  var legend = document.getElementById("legend");
  var legendItem = document.getElementById("collisionPointLegend");
  legend.removeChild(legendItem);

  // if there is no hexbin legend, and there is no collision point legend
  // hide the legend container
  if (legend.childElementCount === 0) {
    legend.style.display = "none";
  }
}
