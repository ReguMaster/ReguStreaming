@echo off
:: BatchGotAdmin
:: http://whackur.tistory.com/53
:-------------------------------------
REM  --> Check for permissions
title Service-Starter
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"

REM --> If error flag set, we do not have admin.
if '%errorlevel%' NEQ '0' (
	echo Requesting administrative privileges...
	goto UACPrompt
) else ( goto gotAdmin )

:UACPrompt
	echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
	echo UAC.ShellExecute "%~s0", "", "", "runas", 1 >> "%temp%\getadmin.vbs"

	"%temp%\getadmin.vbs"
	exit /B

:gotAdmin
	sc start MySQL
	sc start Redis
:--------------------------------------  