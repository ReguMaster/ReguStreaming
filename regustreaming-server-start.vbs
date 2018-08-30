Dim WinScriptHost
Set WinScriptHost = WScript.CreateObject("WScript.Shell")
WinScriptHost.Run "cmd /r npm start"
Set WinScriptHost = Nothing