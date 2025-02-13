#!/bin/bash

echo("Starting development server...")
cd ./app/server
npm run dev

echo("Starting development client...")
cd ../client
npm run dev

echo("Application available at http://localhost:5173")