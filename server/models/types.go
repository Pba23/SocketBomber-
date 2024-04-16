package models

type ReqType string

const (
	Join             ReqType = "join"
	Move             ReqType = "move"
	GameMapUpdate    ReqType = "gameMapUpdate"
	GameOver         ReqType = "gameOver"
	BombExploded     ReqType = "bombExploded"
	PowerFound       ReqType = "powerFound"
	PlayerEliminated ReqType = "playerEliminated"
	PlayerDead       ReqType = "playerDead"
	PlaceBomb        ReqType = "placeBomb"
	Playing          ReqType = "playing"
	Ready            ReqType = "ready"
	Chat             ReqType = "chat"
	PlaceFlame       ReqType = "placeFlame"
	StartGame        ReqType = "startGame"
	CheckState       ReqType = "checkState"
)
