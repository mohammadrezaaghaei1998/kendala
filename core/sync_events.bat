@echo off
cd /d "C:\Users\Zhazira\Desktop\Tourism\tourism"

set PYTHONIOENCODING=utf-8

echo Starting Ken Dala event sync...

"C:\Users\Zhazira\Desktop\Tourism\venv\Scripts\python.exe" manage.py sync_events --country turkey --source ticketmaster --limit 100 --apply > "%~dp0sync_events.log" 2>&1

echo.
echo Sync finished. Check sync_events.log.
