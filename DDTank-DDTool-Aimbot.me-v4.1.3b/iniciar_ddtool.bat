@echo off
title DDTank DDTool Aimbot Web
echo ===================================================
echo     DDTank DDTool Aimbot Web - Executavel 1-Click
echo ===================================================
echo.
echo Verificando dependencias do Node.js...
cd ..
call npm install --silent
echo.
echo Abrindo o DDTool no seu navegador...
start http://localhost:3000
echo Servidor iniciado na porta 3000!
echo.
npm run dev
pause
