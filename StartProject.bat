@echo off
title Iniciando Proyecto Django y React

echo.
echo ---------------------------------------
echo  Iniciando Servidor Django...
echo ---------------------------------------
rem El comando 'cd /d "%~dp0"' cambia al directorio donde se encuentra este archivo .bat.
rem Como este .bat estará en C:\Users\jseba\Web_Project, python manage.py runserver
rem se ejecutará correctamente desde esa ubicación.
start cmd /k "cd /d "%~dp0" && python manage.py runserver"

echo.
echo ---------------------------------------
echo  Iniciando Servidor de Desarrollo React...
echo ---------------------------------------
rem El comando 'cd /d "%~dp0web-client"' cambia al subdirectorio 'web-client'
rem desde la ubicación de este .bat. Como este .bat estará en C:\Users\jseba\Web_Project,
rem npm start se ejecutará desde C:\Users\jseba\Web_Project\web-client.
start cmd /k "cd /d "%~dp0web-client" && npm start"

echo.
echo ----------------------------------------------------
echo  Ambos servidores han sido iniciados en nuevas ventanas.
echo  Puedes cerrar esta ventana de script.
echo ----------------------------------------------------
echo.

rem Si quieres que esta ventana se quede abierta para ver los mensajes finales, quita el 'rem' de la linea de abajo
rem pause