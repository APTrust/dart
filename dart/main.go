package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"os/exec"
	"runtime"
	"time"

	"github.com/APTrust/dart-runner/core"
	"github.com/APTrust/dart/v3/server"
)

// Version value is injected at build time by ./scripts/build_dart.sh
// using -ldflags "-X 'main.Version=$VERSION'"
var Version string

func main() {
	port := flag.Int("port", 8444, "Which port should DART listen on?")
	version := flag.Bool("version", false, "Show version and exit.")
	flag.Parse()
	server.SetVersion(Version)
	if *version {
		fmt.Println(Version)
		os.Exit(0)
	}
	go func() {
		url := fmt.Sprintf("http://localhost:%d", *port)
		time.Sleep(1200 * time.Millisecond)
		openBrowser(url)
	}()

	server.Run(*port, true)
	// TODO: Save pid of dart3 process and browser?
}

func openBrowser(url string) *exec.Cmd {
	var err error
	var command *exec.Cmd

	// TODO: See if we can get command PID
	switch runtime.GOOS {
	case "linux":
		command = exec.Command("xdg-open", url)
	case "windows":
		command = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	case "darwin":
		command = exec.Command("open", url)
	default:
		err = fmt.Errorf("unsupported platform")
	}
	if err != nil {
		log.Fatal(err)
	}

	err = command.Start()
	if err != nil {
		core.Dart.Log.Errorf("Error launching browser for %s: %v", url, err)
	}
	return command
}
