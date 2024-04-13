package utils

import (
	"bomberman/models"

	"github.com/google/uuid"
)

type Response struct {
	Player struct {
		ID       uuid.UUID `json:"id"`
		Nickname string    `json:"nickname"`
		Avatar   string    `json:"avatar"`
		MapId    int       `json:"mapId"`
		Life     int       `json:"life"`
		Position struct {
			X int `json:"x"`
			Y int `json:"y"`
		} `json:"position"`
	} `json:"player"`
	Value interface{} `json:"value"`
	Team  struct {
		ID      uuid.UUID      `json:"id"`
		Name    string         `json:"name"`
		State   models.State   `json:"state"`
		Bombs   []*models.Bomb `json:"bombs"`
		Players []struct {
			ID       uuid.UUID `json:"id"`
			Nickname string    `json:"nickname"`
			Avatar   string    `json:"avatar"`
			MapId    int       `json:"mapId"`
			Life     int       `json:"life"`
			Position struct {
				X int `json:"x"`
				Y int `json:"y"`
			} `json:"position"`
		} `json:"players"`
		Map [][]int `json:"map"`
	} `json:"team"`
	Type    ReqType `json:"type"`
	Message struct {
		Author  string `json:"author"`
		Content string `json:"content"`
	} `json:"message"`
}

func (r *Response) FromTeam(team *models.Team, id uuid.UUID, t ReqType) {
	r.Team.ID = team.ID
	r.Team.Name = team.Name
	r.Team.State = team.State
	r.Type = t
	r.Team.Bombs = team.Bombs
	r.Message = struct {
		Author  string `json:"author"`
		Content string `json:"content"`
	}{}
	p := team.GetPlayer(id)
	r.Player = struct {
		ID       uuid.UUID `json:"id"`
		Nickname string    `json:"nickname"`
		Avatar   string    `json:"avatar"`
		MapId    int       `json:"mapId"`
		Life     int       `json:"life"`
		Position struct {
			X int `json:"x"`
			Y int `json:"y"`
		} `json:"position"`
	}{
		ID:       p.ID,
		Nickname: p.Nickname,
		Avatar:   p.Avatar,
		MapId:    p.MapId,
		Life:     p.Life,
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
		Life     int       `json:"life"`
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
			Life     int       `json:"life"`
			Position struct {
				X int `json:"x"`
				Y int `json:"y"`
			} `json:"position"`
		}{
			ID:       player.ID,
			Nickname: player.Nickname,
			Avatar:   player.Avatar,
			MapId:    player.MapId,
			Life:     player.Life,
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
