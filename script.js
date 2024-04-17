const TIME_TO_BOMB_FALL = 1500
const TIME_EXPLOSION_ANIMATION = 450
const TIME_MIN_DROP_BOMB_INTERVAL = 100

let bombCounter = 0
let explosionCounter = 0
let loseBombsCounter = 0
let dropInterval = 400

const updateText = (elementId, content) => {
    // const element = document.getElementById(elementId)
    // element.textContent = content
}

updateText("drop-interval-text", `${dropInterval}ms`)

const explodeBomb = (bombElement) => {
    if(bombElement.className === "explosion") return
    
    explosionCounter++
    updateText("explosions-text", `${explosionCounter}`)
  
    const bombPosition = bombElement.getBoundingClientRect()
    const randomDegs = Math.round(Math.random() * 360)

    bombElement.className = "explosion"
    bombElement.style.transition = "unset"
    bombElement.style.animationDuration = `${TIME_EXPLOSION_ANIMATION}ms`
    bombElement.style.transform = `rotate(${randomDegs}deg)`
    bombElement.style.left = `${bombPosition.x - 70}px`
    bombElement.style.top = `${bombPosition.y - 30}px`
    
    console.log("ESTOUROU " + bombElement.id)
}

const createBombElement = () => {
    const bombElement = document.createElement("div")
    const positionX = Math.round((Math.random() * (document.body.clientWidth - 100)))+20
    
    bombElement.className = "bomb"
    bombElement.id = `bomb-${bombCounter}`
    bombElement.style.left = `${positionX}px`
    bombElement.style.top = "-110px"
    // bombElement.onmouseenter = () => explodeBomb(bombElement)
    document.body.appendChild(bombElement)

    return bombElement
}

const makeBombElementFall = (bombElement) => {
    bombElement.style.transition = `${TIME_TO_BOMB_FALL}ms ease-in`
    bombElement.style.top = `${window.innerHeight + 20}px`
}

const spawnBomb = () => new Promise((resolve) => {
    const bombElement = createBombElement()
    updateText("bombs-text", bombCounter)

    setTimeout(() => {
        makeBombElementFall(bombElement)
    }, 30)

    setTimeout(() => {
        if(bombElement.className != "explosion"){
          loseBombsCounter++
          updateText("lose-bombs-text", loseBombsCounter)
        }
        bombElement.remove()
    }, TIME_TO_BOMB_FALL + TIME_EXPLOSION_ANIMATION)
  
    setTimeout(() => {
        recursiveBombSpawn()
        resolve()
    }, dropInterval)
})

const recursiveBombSpawn = async () => {
    await spawnBomb()
    if(dropInterval > TIME_MIN_DROP_BOMB_INTERVAL) {
      dropInterval--
      updateText("drop-interval-text", `${dropInterval}ms`)
    }
    bombCounter++
}

requestAnimationFrame(recursiveBombSpawn)