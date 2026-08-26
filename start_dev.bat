@echo off
echo Starting YBBF Main Site (4100), Admin Portal (4500), and Contest Portal (4600)...

REM Start Main Frontend server (Port 4100)
start "YBBF Main Frontend (4100)" cmd /k "npm run dev"

REM Start Admin Portal Frontend (Port 4500)
start "YBBF Admin Portal (4500)" cmd /k "npm run --prefix admin dev"

REM Start Contest Staff Portal Frontend (Port 4600)
start "YBBF Contest Portal (4600)" cmd /k "npm run --prefix contest_ui dev"

echo All frontend servers are launching. Close the respective command prompt windows to stop them.
pause


