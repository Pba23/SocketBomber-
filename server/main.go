package main

import (
	"bomberman/models"
	"encoding/json"
	"fmt"
	"html"
	"html/template"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var (
	engine   = models.New[uuid.UUID]()
	mapSize  = 15
	upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			return r.URL.Path == "/gamesocket" || r.URL.Path == "/waitingroom"
		},
	}
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

	mux.HandleFunc("POST /join", join)

	mux.HandleFunc("/waitingroom", waitingpage)

	mux.HandleFunc("/gamesocket", game)

	http.ListenAndServe("192.168.4.129:8080", mux)
}

type response struct {
	Player struct {
		ID       uuid.UUID `json:"id"`
		Nickname string    `json:"nickname"`
		Avatar   string    `json:"avatar"`
		MapId    int       `json:"mapId"`
		Position struct {
			X int `json:"x"`
			Y int `json:"y"`
		} `json:"position"`
	} `json:"player"`
	Team struct {
		ID      uuid.UUID      `json:"id"`
		Name    string         `json:"name"`
		State   models.State   `json:"state"`
		Bombs   []*models.Bomb `json:"bombs"`
		Players []struct {
			ID       uuid.UUID `json:"id"`
			Nickname string    `json:"nickname"`
			Avatar   string    `json:"avatar"`
			MapId    int       `json:"mapId"`
			Position struct {
				X int `json:"x"`
				Y int `json:"y"`
			} `json:"position"`
		} `json:"players"`
		Map [][]int `json:"map"`
	} `json:"team"`
	Type ReqType `json:"type"`
}

func (r *response) FromTeam(team *models.Team, id uuid.UUID, t ReqType) {
	r.Team.ID = team.ID
	r.Team.Name = team.Name
	r.Team.State = team.State
	r.Type = t
	r.Team.Bombs = team.Bombs
	p := team.GetPlayer(id)
	r.Player = struct {
		ID       uuid.UUID `json:"id"`
		Nickname string    `json:"nickname"`
		Avatar   string    `json:"avatar"`
		MapId    int       `json:"mapId"`
		Position struct {
			X int `json:"x"`
			Y int `json:"y"`
		} `json:"position"`
	}{
		ID:       p.ID,
		Nickname: p.Nickname,
		Avatar:   p.Avatar,
		MapId:    p.MapId,
		Position: struct {
			X int `json:"x"`
			Y int `json:"y"`
		}{
			X: p.Position.X,
			Y: p.Position.Y,
		},
	}

	r.Team.Players = make([]struct {
		ID       uuid.UUID `json:"id"`
		Nickname string    `json:"nickname"`
		Avatar   string    `json:"avatar"`
		MapId    int       `json:"mapId"`
		Position struct {
			X int `json:"x"`
			Y int `json:"y"`
		} `json:"position"`
	}, 0, len(team.Players))
	r.Team.Map = *team.GameMap

	for _, player := range team.Players {
		r.Team.Players = append(r.Team.Players, struct {
			ID       uuid.UUID `json:"id"`
			Nickname string    `json:"nickname"`
			Avatar   string    `json:"avatar"`
			MapId    int       `json:"mapId"`
			Position struct {
				X int `json:"x"`
				Y int `json:"y"`
			} `json:"position"`
		}{
			ID:       player.ID,
			Nickname: player.Nickname,
			Avatar:   player.Avatar,
			MapId:    player.MapId,
			Position: struct {
				X int `json:"x"`
				Y int `json:"y"`
			}{
				X: player.Position.X,
				Y: player.Position.Y,
			},
		})
	}
}

func join(w http.ResponseWriter, r *http.Request) {
	type request struct {
		Nickname string `json:"nickname"`
	}

	var req request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Failed to decode JSON body: "+err.Error(), http.StatusBadRequest)
		return
	}

	if req.Nickname == "" {
		http.Error(w, "Nickname cannot be empty", http.StatusBadRequest)
		return
	}

	player := models.NewPlayer(html.EscapeString(req.Nickname), &models.Position{X: 0, Y: 0}, &models.Team{})
	inTeam := false
	engine.Range(func(key uuid.UUID, value *models.Team) bool {
		if len(value.Players) < models.MaxPlayers && value.State == models.Waiting {
			player.MapId = len(value.Players) + 1*2 + 1
			player.Avatar = models.Avatars[len(value.Players)]
			player.SetTeam(value)
			value.AddPlayer(player)
			inTeam = true
			return false
		}
		return true
	})

	if !inTeam {
		team := models.NewTeam(fmt.Sprintf("Team %d", engine.Size()), mapSize)
		player.MapId = len(team.Players) + 1*2 + 1
		player.Avatar = models.Avatars[len(team.Players)]
		player.SetTeam(team)
		team.AddPlayer(player)
		engine.Add(team.ID, team)
	}

	// type response struct {
	// 	ID       uuid.UUID `json:"id"`
	// 	Nickname string    `json:"nickname"`
	// 	Team     struct {
	// 		ID    uuid.UUID    `json:"id"`
	// 		State models.State `json:"state"`
	// 	} `json:"team"`
	// }

	resp := new(response)
	resp.FromTeam(player.Team, player.ID, Join)

	if err := json.NewEncoder(w).Encode(resp); err != nil {
		log.Println("Failed to encode response: ", err)
		http.Error(w, "Failed to encode response: "+err.Error(), http.StatusInternalServerError)
	}
}

type ReqType string

const (
	Join             ReqType = "join"
	Move             ReqType = "move"
	GameMapUpdate    ReqType = "gameMapUpdate"
	BombExploded     ReqType = "bombExploded"
	PlayerEliminated ReqType = "playerEliminated"
	PlayerDead       ReqType = "playerDead"
	PlaceBomb        ReqType = "placeBomb"
	Playing          ReqType = "playing"
)

func waitingpage(w http.ResponseWriter, r *http.Request) {
	type request struct {
		Type     ReqType   `json:"type"`
		TeamId   uuid.UUID `json:"teamId"`
		PlayerId uuid.UUID `json:"playerId"`
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for {
		var req request
		err := conn.ReadJSON(&req)
		if err != nil {
			conn.WriteJSON(map[string]string{"error": err.Error()})
			return
		}
		if req.Type == Join {
			team := engine.Get(req.TeamId)

			if team == nil {
				conn.WriteJSON(map[string]string{"error": "Team not found"})
				conn.Close()
				return
			}
			if team.State != models.Waiting {
				conn.WriteJSON(map[string]string{"error": "Game already started or finished"})
				conn.Close()
				return
			}
			player := team.GetPlayer(req.PlayerId)
			if player == nil {
				conn.WriteJSON(map[string]string{"error": "Player not found"})
				conn.Close()
				return
			}

			player.Conn = conn

			team.UpdatePlayer(player.ID, player)

			for id, player := range team.Players {
				if player.Conn != nil {
					resp := new(response)
					resp.FromTeam(team, id, Join)
					err := player.Conn.WriteJSON(resp)
					if err != nil {
						conn.Close()
						team.Players[id].Conn = nil
						return
					}
				}
			}
			if len(team.Players) == models.MaxPlayers {
				team.State = models.Playing
				team.GameMap.GenerateGameTerrain(len(team.Players))
				positions := team.GameMap.GenerateStartingAreas(team.Players)
				for id, player := range team.Players {
					team.GameMap.MovePlayer(*player.Position, positions[id], player.MapId)
					player.Position.Update(positions[id].X, positions[id].Y)
					delete(positions, id)
					team.UpdatePlayer(player.ID, player)
				}

				for id, player := range team.Players {
					if player.Conn != nil {
						resp := new(response)
						resp.FromTeam(team, id, Playing)
						err := player.Conn.WriteJSON(resp)
						if err != nil {
							conn.Close()
							team.Players[id].Conn = nil
							return
						}
					}
				}
			}

			engine.Update(team.ID, team)
		}
	}
}

func game(w http.ResponseWriter, r *http.Request) {
	type request struct {
		PlayerId uuid.UUID `json:"playerId"`
		TeamId   uuid.UUID `json:"teamId"`
		Position struct {
			X int `json:"x"`
			Y int `json:"y"`
		} `json:"position"`
		Messsaage struct {
			Content string `json:"content"`
		} `json:"message"`
		Type ReqType `json:"type"`
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for {
		var req request
		err := conn.ReadJSON(&req)
		if err != nil {
			conn.WriteJSON(map[string]string{"error": err.Error()})
			return
		}

		team := engine.Get(req.TeamId)
		if team == nil {
			conn.WriteJSON(map[string]string{"error": "Team not found"})
			return
		}
		if team.State != models.Playing {
			conn.WriteJSON(map[string]string{"error": "Game not started or already finished"})
			return
		}
		player := team.GetPlayer(req.PlayerId)
		if player == nil {
			conn.WriteJSON(map[string]string{"error": "Player not found"})
			return
		}
		if req.Type == Join {
			player.Conn = conn
		} else if req.Type == Move {
			if player.IsDead() {
				continue
			}
			newPositon := models.Position{}
			newPositon.X = req.Position.X + player.Position.X
			newPositon.Y = req.Position.Y + player.Position.Y

			if team.GameMap.CanMove(newPositon, *player.Position) {
				team.GameMap.MovePlayer(*player.Position, newPositon, player.MapId)
				player.Position.Update(newPositon.X, newPositon.Y)

				for _, p := range team.Players {
					resp := new(response)
					resp.FromTeam(team, p.ID, GameMapUpdate)
					err := p.Conn.WriteJSON(resp)
					if err != nil {
						continue
					}
				}
			} else {
				conn.WriteJSON(map[string]string{"invalid": "Invalid move"})
			}

		} else if req.Type == PlaceBomb {
			if player.IsDead() {
				continue
			}
			player.Position.Lock()

			ok, id := team.PlaceBomb(player.Position.X, player.Position.Y)
			for _, p := range team.Players {
				resp := new(response)
				resp.FromTeam(team, p.ID, PlaceBomb)
				err := p.Conn.WriteJSON(resp)
				if err != nil {
					continue
				}
			}
			if ok {
				go func(id uuid.UUID) {
					for _, bomb := range team.Bombs {
						if bomb.Id == id {
							time.Sleep(time.Duration(bomb.Timer) * time.Second)
							deadPlayers := team.ExplodeBomb(bomb.Id)
							for _, v := range deadPlayers {
								for _, p := range team.Players {
									if p.MapId == v {
										resp := new(response)
										resp.FromTeam(team, p.ID, PlayerEliminated)
										err := p.Conn.WriteJSON(resp)
										if err != nil {
											continue
										}
										isdead := p.LifeDown()
										if isdead {
											resp := new(response)
											resp.FromTeam(team, p.ID, PlayerDead)
											err := p.Conn.WriteJSON(resp)
											if err != nil {
												continue
											}
											// p.Position.Lock()
											// p.Position.X = 0
											// p.Position.Y = 0
											// p.Position.Unlock()
											// p.Life = 3
											// team.GameMap.MovePlayer(*p.Position, models.Position{X: 0, Y: 0}, p.MapId)
											// for _, p := range team.Players {
											// 	resp := new(response)
											// 	resp.FromTeam(team, p.ID, GameMapUpdate)
											// 	err := p.Conn.WriteJSON(resp)
											// 	if err != nil {
											// 		continue
											// 	}
											// }
										}
										team.AddPlayer(p)
									}

								}
							}
							for _, p := range team.Players {
								resp := new(response)
								resp.FromTeam(team, p.ID, BombExploded)
								err := p.Conn.WriteJSON(resp)
								if err != nil {
									continue
								}
							}
							time.Sleep(2 * time.Second)
							team.RemoveExplosion(bomb.Id)
							for _, p := range team.Players {
								resp := new(response)
								resp.FromTeam(team, p.ID, GameMapUpdate)
								err := p.Conn.WriteJSON(resp)
								if err != nil {
									continue
								}
							}
						}
					}
				}(id)
			}
			player.Position.Unlock()

		} else {
			conn.WriteJSON(map[string]string{"error": "Invalid request type"})
		}
		team.UpdatePlayer(player.ID, player)

		engine.Update(team.ID, team)
	}

}
