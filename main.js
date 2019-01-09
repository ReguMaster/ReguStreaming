/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use struct'

const Electron = {};
const
{
    app,
    BrowserWindow,
    Menu,
    shell,
    ipcMain,
    dialog
} = require( "electron" );
const path = require( "path" );
const pidusage = require( "pidusage" );
const events = require( "events" );
const child_process = require( "child_process" );
const config = require( "./const/config" );
const eventEmitter = new events.EventEmitter( );

eventEmitter.on( "startup", function( )
{
    Electron.sendIPC( "serverStatus", 1 );
} );

eventEmitter.on( "shutdown", function( )
{
    Electron.sendIPC( "serverStatus", 0 );
} );

const MAIN_MENU = [
    {
        label: "서비스",
        submenu: [
            {
                label: "서비스 시작",
                accelerator: "F3",
                click: ( ) =>
                {
                    dialog.showMessageBox( Electron.mainWindow,
                    {
                        type: "warning",
                        title: "ReguStreaming",
                        message: "ReguStreaming 서비스를 시작하시겠습니까?",
                        buttons: [ "확인", "취소" ],
                        defaultId: 1,
                        cancelId: 1,
                        noLink: true
                    }, function( res )
                    {
                        if ( res === 0 )
                        {
                            if ( !Electron.startMainProcess( ) )
                            {
                                dialog.showMessageBox( Electron.mainWindow,
                                {
                                    type: "error",
                                    title: "ReguStreaming",
                                    message: "ReguStreaming 서비스 프로세스가 이미 활성화되어 있습니다.",
                                    detail: "ReguStreaming 서비스 프로세스가 활성화되어 있으면 서비스를 활성화 할 수 없습니다.",
                                    buttons: [ "확인" ],
                                    noLink: true
                                } );
                            }
                        }
                    } );
                }
        },
            {
                label: "서비스 중지",
                accelerator: "F4",
                click: ( ) =>
                {
                    dialog.showMessageBox( Electron.mainWindow,
                    {
                        type: "warning",
                        title: "ReguStreaming",
                        message: "ReguStreaming 서비스를 중지하시겠습니까?",
                        detail: "ReguStreaming 서비스를 중지할 경우 모든 활성화된 연결이 끊깁니다.",
                        buttons: [ "확인", "취소" ],
                        defaultId: 1,
                        cancelId: 1,
                        noLink: true
                    }, function( res )
                    {
                        if ( res === 0 )
                        {
                            if ( !Electron.stopMainProcess( ) )
                            {
                                dialog.showMessageBox( Electron.mainWindow,
                                {
                                    type: "error",
                                    title: "ReguStreaming",
                                    message: "ReguStreaming 서비스 프로세스가 활성화되어 있지 않습니다.",
                                    detail: "* ReguStreaming 서비스 프로세스가 활성화되어 있는지 확인하십시오.\n* 올바르게 서비스가 시작되지 않았을 경우 서비스 프로세스가 활성화되지 않습니다.",
                                    buttons: [ "확인" ],
                                    noLink: true
                                } );
                            }
                        }
                    } );
                }
            },
            {
                label: "서비스 중지 및 다시 시작",
                accelerator: "F5",
                click: ( ) =>
                {
                    Electron.stopMainProcess( );
                    setTimeout( ( ) => Electron.startMainProcess( ), 500 );
                }
        },
            {
                type: "separator"
            },
            {
                label: "서비스 종료",
                click: ( ) =>
                {
                    dialog.showMessageBox( Electron.mainWindow,
                    {
                        type: "warning",
                        title: "ReguStreaming",
                        message: "정말로 ReguStreaming 서버를 종료하시겠습니까?",
                        detail: "ReguStreaming 서버를 종료하시면 모든 활성화된 연결이 끊깁니다.",
                        buttons: [ "확인", "취소" ],
                        defaultId: 1,
                        cancelId: 1,
                        noLink: true
                    }, function( res )
                    {
                        if ( res === 0 )
                            app.exit( 0 );
                    } );
                }
			}
		]
    },
    {
        label: "개발자",
        submenu: [
            {
                label: "개발자 콘솔 열기/닫기",
                accelerator: "F12",
                role: "toggledevtools"
        },
    //         {
    //             label: "재시작",
    //             accelerator: "F5",
    //             click: ( ) =>
    //             {
    //                 Electron.stopMainProcess( );
    //                 child_process.execSync( "regustreaming-server-start.vbs" );
    //                 app.exit( 0 );
    //             }
    // }
		]
    },
    {
        label: "도구",
        submenu: [
            {
                label: "로그 청소",
                accelerator: "Shift+C",
                click: ( ) => Electron.sendIPC( "clearLog" )
        },
            {
                label: "ReguStreaming 접속",
                accelerator: "Shift+O",
                click: ( ) => shell.openExternal( "https://" + config.Server.DOMAIN )
    }
		]
    },
    {
        label: "정보",
        submenu: [
            {
                label: "오픈 소스 프로젝트",
                click: ( ) => shell.openExternal( "https://github.com/ReguMaster/ReguStreaming" )
        }
		]
	}
];

class MainProcess
{
    constructor( cmd )
    {
        this.cmd = cmd;
    }

    start( )
    {
        if ( this.getStatus( ) )
            return false;

        this.process = child_process.fork( this.cmd );

        this.process.on( "message", function( body )
        {
            switch ( body.type )
            {
                case "log":
                    Electron.sendIPC( "log", body.logLevel || 0, body.message );
                    break;
                case "getAcceptableClients":
                    Electron.sendIPC( "getAcceptableClients", body.count );
                    break;
                case "updateClientCount":
                    Electron.sendIPC( "updateClientCount", body.count );
                    break;
                case "exit":
                    this.kill( );
                    break;
                case "commandResultAlert":
                    dialog.showMessageBox( Electron.mainWindow,
                    {
                        type: "error",
                        title: "ReguStreaming",
                        message: `${ body.command } 명령어 실행 중 오류가 발생했습니다.`,
                        detail: body.message,
                        buttons: [ "확인" ],
                        noLink: true
                    } );
            }
        } );

        this.process.on( "error", function( err )
        {
            Electron.sendIPC( "log", 2, `[Server] An error has occurred in the main process. (err:${ err.stack })` );
        } );

        this.process.on( "close", function( code, signal )
        {
            Electron.sendIPC( "log", 1, `[Server] Main Process closed with (signal: ${ signal }, code: ${ code })` );

            // this.process.removeAllListeners( ); // 오류 발생..
            eventEmitter.emit( "shutdown" );
            this.process = null;
        } );

        return true;
    }

    getStatus( )
    {
        return this.process && !this.process.killed;
    }

    send( message )
    {
        this.process.send( message );
    }

    kill( sig )
    {
        if ( this.process || !this.process.killed )
            this.process.kill( sig || "SIGINT" );
    }
}

Electron.mainWindow = null;

Electron.startMainProcess = function( )
{
    if ( !Electron.mainProcess )
    {
        Electron.sendIPC( "log", 1, `[Server] Main Process starting.` );

        Electron.mainProcess = new MainProcess( "./app.js" );
        Electron.mainProcess.start( );

        eventEmitter.emit( "startup" );

        return true;
    }
    else
        return false;
}

Electron.stopMainProcess = function( )
{
    if ( Electron.mainProcess && Electron.mainProcess.getStatus( ) )
    {
        Electron.mainProcess.kill( );
        Electron.mainProcess = null;

        return true;
    }
    else
        return false;
}

Electron.initializeWindow = function( )
{
    Electron.mainWindow = new BrowserWindow(
    {
        width: 1280,
        height: 720,
        minWidth: 800,
        minHeight: 600,
        title: "ReguStreaming [MainServer #0] : " + config.Server.DOMAIN,
        icon: path.join( __dirname, "electron", "icon.ico" ),
        show: false,
        closable: false,
        resizable: true,
        movable: true,
    } );

    Electron.mainWindow.on( "ready-to-show", function( )
    {
        Electron.mainWindow.show( );
        Electron.startMainProcess( );
    } );
    Electron.mainWindow.on( "closed", function( )
    {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        Electron.mainWindow = null;
    } );

    Electron.mainWindow.loadURL( `file://${ path.join( __dirname, "electron", "index.html" ) }` );
    Menu.setApplicationMenu( Menu.buildFromTemplate( MAIN_MENU ) );
}

Electron.sendIPC = function( ...arg )
{
    if ( Electron.mainWindow && Electron.mainWindow.webContents )
        Electron.mainWindow.webContents.send.apply( Electron.mainWindow.webContents, arg );
}

ipcMain.on( "commandExecute", function( e, arg )
{
    Electron.mainProcess.send( arg );
} );

setInterval( function( )
{
    if ( Electron.mainProcess )
    {
        pidusage( process.pid, function( err, stats )
        {
            if ( !err )
            {
                Electron.sendIPC( "serverStats", stats );
            }
        } );
    }
}, 1000 );

app.on( "ready", Electron.initializeWindow );
app.on( "window-all-closed", function( )
{
    if ( process.platform !== "darwin" )
        app.quit( );
} );

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.