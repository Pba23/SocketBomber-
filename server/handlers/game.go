package handlers

import (
	"bomberman/config"
	"bomberman/models"
	"bomberman/utils"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var (
	Upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			return r.URL.Path == "/gamesocket"
		},
	}
)

func Game(w http.ResponseWriter, r *http.Request) {
	conn, err := Upgrader.Upgrade(w, r, nil)
	if err != nil {
		http.Error(w, "Failed to upgrade connection: "+err.Error(), http.StatusInternalServerError)
		return
	}

	for {
		req := &models.Request{}

		if err := conn.ReadJSON(req); err != nil {
			err = conn.WriteJSON(map[string]string{"error": "Failed to read message"})
			if err != nil {
				http.Error(w, "Failed to write message: "+err.Error(), http.StatusInternalServerError)
				return
			}
			continue
		}

		if req.Type == models.Join {

			if strings.TrimSpace(req.Nickname) == "" {
				err := conn.WriteJSON(map[string]string{"error": "Nickname is required"})
				if err != nil {
					http.Error(w, "Failed to write message: "+err.Error(), http.StatusInternalServerError)
					return
				}
				continue
			}

			is_InTeam := false
			id := uuid.UUID{}

			config.Engine.Range(func(key uuid.UUID, team *models.Team) bool {
				if team.State == models.Waiting {

					newPlayer := models.NewPlayer(req.Nickname, &models.Position{}, team, conn)

					team.AddPlayer(newPlayer)

					response := &models.Response{}
					response.FromTeam(team, models.Join)
					response.FromPlayer(newPlayer)

					team.Broadcast(response)
					is_InTeam = true
					id = team.ID
					return false
				}
				return true
			})

			if !is_InTeam {
				team := models.NewTeam(fmt.Sprintf("Team %d", config.Engine.Size()+1), models.MaxPlayers)
				newPlayer := models.NewPlayer(req.Nickname, &models.Position{}, team, conn)
				team.AddPlayer(newPlayer)
				response := &models.Response{}
				response.FromTeam(team, models.Join)
				response.FromPlayer(newPlayer)

				team.Broadcast(response)
				id = team.ID
				config.Engine.Add(team.ID, team)
			}
			currentTeam := config.Engine.Get(id)

			if currentTeam != nil {
				if len(currentTeam.Players) == 2 {
					go PlayGame(currentTeam)
				} else if len(currentTeam.Players) == models.MaxPlayers {
					go func(team *models.Team) {
						team.State = models.TeamPlaying

						team.GameMap = models.NewMap(config.MapSize)

						resp := new(models.Response)
						resp.FromTeam(team, models.ReqType(models.TeamPlaying))
						team.GameMap.GenerateGameTerrain(len(team.Players))

						team.Broadcast(resp)
						StartGame(team)
						// Cancel the long running action
						team.Cancel()
					}(currentTeam)
				}
			}
			config.Engine.Add(id, currentTeam)

		} else if req.Type == models.CheckState {
			team := config.Engine.Get(req.TeamId)
			if team == nil {
				err := conn.WriteJSON(map[string]string{"error": "Team not found"})
				if err != nil {
					return
				}
				return
			}

			player := team.GetPlayer(req.PlayerId)

			if player == nil {
				team.State = models.Finished
			}

			if player.IsDead() {
				team.State = models.Finished
			}

			resp := new(models.Response)
			resp.FromTeam(team, models.CheckState)

			err := conn.WriteJSON(resp)
			if err != nil {
				return
			}

		} else {
			GamePlay(req, conn)
		}

	}

}

func GamePlay(req *models.Request, conn *websocket.Conn) {
	team := config.Engine.Get(req.TeamId)
	if team == nil {
		err := conn.WriteJSON(map[string]string{"error": "Team not found"})
		if err != nil {
			return
		}
		return
	}

	if team.State != models.TeamPlaying {
		err := conn.WriteJSON(map[string]string{"error": "Game not started or already finished"})
		if err != nil {
			return
		}
		return
	}

	player := team.GetPlayer(req.PlayerId)
	if player == nil {
		err := conn.WriteJSON(map[string]string{"error": "Player not found"})
		if err != nil {
			return
		}
		return
	}

	switch req.Type {
	case models.Move:
		if !team.Start {
			err := conn.WriteJSON(map[string]string{"error": "Game not started"})
			if err != nil {
				return
			}
			return
		}
		utils.Move(req, conn, team, player)
	case models.PlaceBomb:
		if !team.Start {
			err := conn.WriteJSON(map[string]string{"error": "Game not started"})
			if err != nil {
				return
			}
			return
		}
		utils.PlaceBomb(req, conn, team, player)
	case models.Chat:
		log.Println("Chat")
		utils.Chat(req, conn, team, player)
	default:
		if conn != nil {
			err := conn.WriteJSON(map[string]string{"error": "Invalid request type"})
			if err != nil {
				return
			}
			return
		}
	}
}

// StartGame starts the game after 10 seconds.
func StartGame(team *models.Team) {
	go func() {
		time.Sleep(10 * time.Second)

		team.StartGame()

		positions := team.GameMap.GenerateStartingAreas(team.Players)
		for i, player := range team.Players {
			player.Position.Update(positions[i].X, positions[i].Y)

			resp := new(models.Response)
			resp.FromPlayer(player)

			resp.FromPosition(player.Position.X, player.Position.Y)
			resp.FromTeam(team, models.StartGame)

			team.AddPlayer(player)
			team.Broadcast(resp)
		}

		config.Engine.Update(team.ID, team)
	}()
}

// PlayGame plays the game.
func PlayGame(team *models.Team) {
	select {
	case <-time.After(20 * time.Second):
		team.State = models.TeamPlaying

		team.GameMap = models.NewMap(config.MapSize)

		resp := new(models.Response)
		resp.FromTeam(team, models.ReqType(models.TeamPlaying))
		team.GameMap.GenerateGameTerrain(len(team.Players))

		team.Broadcast(resp)
		StartGame(team)
	case <-team.Ctx.Done():
		return
	}
}
