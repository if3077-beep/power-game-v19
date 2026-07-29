@echo off
chcp 65001 >nul

echo ============================================================
echo   TrendRadar MCP Server (轻量 HTTP 模式)
echo ============================================================
echo.
echo [模式] HTTP
echo [地址] http://localhost:3333/mcp
echo [提示] 按 Ctrl+C 停止服务
echo.

cd /d "%~dp0"
python -m mcp_server.server --transport http --host 0.0.0.0 --port 3333

pause
