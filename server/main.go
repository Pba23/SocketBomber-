package main

import (
	"bomberman/handlers"
	"html/template"
	"log"
	"net/http"
)

func main() {
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

	// mux.HandleFunc("/join", handlers.Join)

	// mux.HandleFunc("/waitingroom", handlers.Waitingpage)

	mux.HandleFunc("/gamesocket", handlers.Game)

	log.Fatalln(http.ListenAndServe("192.168.107.129:8080", mux))
}
