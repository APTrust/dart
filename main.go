package main

import (
	"embed"

	"github.com/APTrust/dart/v3/server"
	"github.com/APTrust/dart/v3/server/controllers"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/linux"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed build/appicon.png
var icon []byte

// Version value is injected at build time by ./scripts/build_dart.sh
// using -ldflags "-X 'main.Version=$VERSION'"
var Version string

func main() {
	// Create an instance of the app structure
	app := NewApp()

	// Set the version for the server
	server.SetVersion(Version)
	controllers.IsRunningWails = true

	go server.Run(9797, true)

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "DART",
		Width:  1400,
		Height: 900,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
		DragAndDrop: &options.DragAndDrop{
			EnableFileDrop:     true,
			DisableWebViewDrop: false,
		},
		Mac: &mac.Options{
			About: &mac.AboutInfo{
				Title:   "DART",
				Message: "Free and open source software for the digital preservation community from APTrust.",
				Icon:    icon,
			},
		},
		Linux: &linux.Options{
			Icon:        icon,
			ProgramName: "DART",
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
