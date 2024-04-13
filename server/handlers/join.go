package handlers

import (
	"bomberman/models"
	"bomberman/utils"
	"encoding/json"
	"fmt"
	"html"
	"log"
	"net/http"

	"github.com/google/uuid"
)

func Join(w http.ResponseWriter, r *http.Request) {
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
	utils.Engine.Range(func(key uuid.UUID, value *models.Team) bool {
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
		team := models.NewTeam(fmt.Sprintf("Team %d", utils.Engine.Size()), utils.MapSize)
		player.MapId = len(team.Players) + 1*2 + 1
		player.Avatar = models.Avatars[len(team.Players)]
		player.SetTeam(team)
		team.AddPlayer(player)
		utils.Engine.Add(team.ID, team)
	}

	// type response struct {
	// 	ID       uuid.UUID `json:"id"`
	// 	Nickname string    `json:"nickname"`
	// 	Team     struct {
	// 		ID    uuid.UUID    `json:"id"`
	// 		State models.State `json:"state"`
	// 	} `json:"team"`
	// }

	resp := new(utils.Response)
	resp.FromTeam(player.Team, player.ID, utils.Join)

	if err := json.NewEncoder(w).Encode(resp); err != nil {
		log.Println("Failed to encode response: ", err)
		http.Error(w, "Failed to encode response: "+err.Error(), http.StatusInternalServerError)
	}
}
