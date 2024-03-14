# GGR472 Lab 4: Incorporating GIS analysis into web maps using Turf.js

This repository contains the code for GGR472 Lab 4 (Winter 2024) created by Jia Hao Choo.
The purpose of this lab is to incorporate GIS analysis into web maps using Turf.js.

The web map can be accessed [here](https://jiahao29.github.io/ggr472_lab4/).

## About the Web Map

The web map serves the purpose of visualising the pedestrian/cyclists collision points in
the city of Toronto. Particularly, it provides a hexagon grid visualisation of the collision
points, which summarises the collision points within a certain area in the city of Toronto.
This helps users to identify trends and patterns of high risk areas for pedestrian/cyclists
in the city. The map contains two layers:

1. Pedestrian/Cyclists Collision Points in the City of Toronto
2. Hexagon grids for summarising collision points within a certain area in the City of Toronto

## Map Analysis

The primary analysis of the web map is to create a hexagon grids for
collision points in the city of Toronto. The hexagon grids are created from
a bounding box of the collision points, and each heaxgon grid contains the number
of collision points that fall within the grid, which are collected from the
collision points dataset.

## Map Styling

The hexagon grids are styling according to the number of collision points, using
a step function to determine the color of the hexagon grids. Note that areas with
no collision points are filtered out of the map.

The collision points are styled using a simple circle marker, with the color being
determined by the type of collision. If it is a non-fatal collision, the color is
yellow, and if it is a fatal collision, the color is red.

## Map Interactivity

There is a control panel on the top left corner of the map where users can
toggle on and off the hexagon grids, and the collision points layer. There is also
a legend on the bottom right which will dynmically update based on which layer(s)
are currently visible on the map.

For the collision points layer, users can click on the circle marker to view the
victim types of the collision (i.e., pedestrian or cyclists).

For the hexagon grids, users can click on the hexagon grids to view the number of
collision points within the grid.

Note that if both layers are on, the collision points layer will be on top of the
hexagon grids layer, hence any click events on the hexagon grids will be disabled.
