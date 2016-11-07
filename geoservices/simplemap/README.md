# About simplemap

This is a very simple implementation of a reusable component that displays assets as markers on a Google map.
The location of the assets is published by backend logic running on scriptr.io

# Pre-requisites

You need to create a channel in your scriptr.io account. By default the component expects it to be named "map".
You can change the name in the configuration file (see below)

# Configuration

Update /geoservices/simplemap/config.js with your own settings (read comments in script for more)

# Adding your own datahandler

The datahandler.js script contains callback functions that are invoked whenever a message is published on the channel.
You can use the default handler function (only displays markers on the map) or implement your own handler to add more logic.
