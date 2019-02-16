@echo off
set /p id="Enter cloudnode ID: "
node.exe index.js %id%
pause
