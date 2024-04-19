package main

import (
	"bomberman/handlers"
	"flag"
	"html/template"
	"log"
	"net/http"
)

var (
	addr = ""
)

func main() {

	flag.StringVar(&addr, "addr", "localhost:8080", "http service address")

	flag.Parse()

	mux := http.NewServeMux()

	fs := http.FileServer(http.Dir("../client/static/"))
	mux.Handle("/static/", http.StripPrefix("/static/", fs))

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		template, err := template.ParseFiles("../client/index.html")
		if err != nil {
			http.Error(w, "Failed to parse template: "+err.Error(), http.StatusInternalServerError)
			return
		}

		if err := template.Execute(w, nil); err != nil {
			http.Error(w, "Failed to execute template: "+err.Error(), http.StatusInternalServerError)
		}
	})

	mux.HandleFunc("/gamesocket", handlers.Game)

	log.Println("Server started on " + addr + " ..." + "\n" + "Press Ctrl+C to stop.")

	log.Fatalln(http.ListenAndServe(addr, mux))
}
