package models

import (
	"github.com/google/uuid"
)

type Message struct {
	Content string `json:"content"`
}

type Response struct {
	ID       uuid.UUID `json:"id"`
	Nickname string    `json:"nickname"`
	Avatar   string    `json:"avatar"`
	Life     int       `json:"life"`
	Message  *Message  `json:"message"`
	Position struct {
		X int `json:"x"`
		Y int `json:"y"`
	} `json:"position"`
	NewPosition struct {
		X int `json:"x"`
		Y int `json:"y"`
	} `json:"new_position"`
	Team struct {
		ID      uuid.UUID `json:"id"`
		Name    string    `json:"name"`
		Map     *Map      `json:"map"`
		State   State     `json:"state"`
		Started bool      `json:"started"`
		Players []struct {
			ID       uuid.UUID `json:"id"`
			Nickname string    `json:"nickname"`
			Avatar   string    `json:"avatar"`
		} `json:"players"`
	} `json:"team"`
	Bomb  *Bomb   `json:"bomb"`
	Power string  `json:"power"`
	Type  ReqType `json:"type"`
}

func (r *Response) FromTeam(team *Team, t ReqType) {
	r.Team.ID = team.ID
	r.Team.Name = team.Name
	r.Type = t
	r.Team.Map = team.GameMap
	r.Team.State = team.State
	r.Team.Started = team.Start
	for _, p := range team.Players {
		r.Team.Players = append(r.Team.Players, struct {
			ID       uuid.UUID `json:"id"`
			Nickname string    `json:"nickname"`
			Avatar   string    `json:"avatar"`
		}{
			ID:       p.ID,
			Nickname: p.Nickname,
			Avatar:   p.Avatar,
		})
	}
}

func (r *Response) FromPlayer(player *Player) {
	r.ID = player.ID
	r.Nickname = player.Nickname
	r.Avatar = player.Avatar
	r.Life = player.Life
	r.Position.X = player.Position.X
	r.Position.Y = player.Position.Y
}

func (r *Response) FromMessage(message string) {
	r.Message = &Message{Content: message}
}

func (r *Response) FromPosition(x, y int) {
	r.NewPosition.X = x
	r.NewPosition.Y = y
}

func (r *Response) FromBomb(x, y int, power string) {
	bomb := new(Bomb)
	bomb.NewBomb(x, y, power)
	r.Bomb = bomb
}

func (r *Response) FromImpact(posiX, posiY int) {
	r.Bomb.Impact = append(r.Bomb.Impact, Position{X: posiX, Y: posiY})
}

func (r *Response) FromPower(x, y int, power string) {
	r.Power = power
	r.Position.X = x
	r.Position.Y = y
}

type Request struct {
	PlayerId uuid.UUID `json:"playerId"`
	TeamId   uuid.UUID `json:"teamId"`
	Nickname string    `json:"nickname"`
	Position struct {
		X int `json:"x"`
		Y int `json:"y"`
	} `json:"position"`
	Message struct {
		Content string `json:"content"`
	} `json:"message"`
	Type ReqType `json:"type"`
}
