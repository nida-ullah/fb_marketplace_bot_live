@REM @echo off
@REM echo Starting Django backend...

@REM REM Activate virtual environment
call C:\Users\Administrator\Documents\fb_marketplace_bot\env\Scripts\activate.bat

REM Run Waitress server
@REM start "Waitress Server" cmd /k "waitress-serve --listen=127.0.0.1:8000 bot_core.wsgi:application"
start "Waitress Server" cmd /k "waitress-serve --listen=0.0.0.0:9000 --threads=32 --backlog=4096 --channel-timeout=120 bot_core.wsgi:application
"

REM Run Cloudflare Tunnel (change your tunnel name)
start "Cloudflare Tunnel" cmd /k "cloudflared tunnel run django-backend"

@REM echo Backend is now running!
@REM pause



@REM @echo off
@REM echo ================================================
@REM echo   Facebook Marketplace Bot - Backend Setup
@REM echo ================================================
@REM echo.

@REM echo [1/3] Installing required packages...
@REM pip install djangorestframework djangorestframework-simplejwt django-cors-headers

@REM echo.
@REM echo [2/3] Running migrations...
@REM python manage.py migrate

@REM echo.
@REM echo [3/3] Starting Django server...
@REM echo.
@REM echo Backend will run on: http://localhost:8000
@REM echo API endpoints available at: http://localhost:8000/api/
@REM echo.
@REM echo Press Ctrl+C to stop the server
@REM echo.

@REM python manage.py runserver
