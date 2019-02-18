@echo off
set /p id="Enter cloudnode ID: "
win-x64\node.exe src\index.js %id%
pause
