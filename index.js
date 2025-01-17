// Mixing express + websockets:
    // var server = app.listen(8080, function) {
    // const wss = new WebSocket.WebSocketServer({ server: server })


const units = require('./units')
const c = require('./units')
const WebSocket = require('ws')
const express = require("express")

const app = express()
app.use(express.static("public"))
var server = app.listen(8080, function () {
    console.log("Server is running...")
})

const wss = new WebSocket.WebSocketServer({ server: server })

// console.log("Server is running...")

gameBoard = new c.Board()
setUpBoard(gameBoard)
numClients = 0;
wss.on('connection', function (ws) { //Event: client connects to server
    numClients += 1;
    
    console.log("client connected, assigning as p" + numClients)
    ws.send(JSON.stringify({
        action: "ASSIGN",
        player: "p" + numClients
    }))
    ws.send(JSON.stringify({
        action: "UPDATE",
        gameBoard: gameBoard
    }))
    // ws.on('close', function () {
    //     numClients -= 1
    // })
    ws.on('error', function (error) { //Event: error
        console.log("connection error:", error)
    })

    ws.on('message', function (data, isBinary) {
        data = JSON.parse(data)
        
        switch (data.action) {
            case "MOVE":
                if (data.moves.length > 2) {
                    ws.send("invalid request: too many moves")
                    return
                }

                for (var move of data.moves) {
                    var unit = gameBoard.units[move.unitId]
                    var moveDist = calcDist(unit.pos, move.pos)
                    // console.log(moveDist)
                    // console.log(unit)
                    if (unit.spd < moveDist) {
                        ws.send("invalid request: move out of range")
                        return
                    }
                    unit.pos = move.pos
                }

                advanceGameState(gameBoard)

                wss.clients.forEach(function (client) { //Event: data recieved from client
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            action: "UPDATE",
                            gameBoard: gameBoard
                        }), { binary: isBinary })
                    }
                })
                break

            case 'ATTACK':
                if (data.attacks > 2) {
                    ws.send("invalid request: too many attacks")
                    return
                }

                for (var attack of data.attacks) {
                    var unit = gameBoard.units[attack.unitId]
                    var target = gameBoard.units[attack.targetId]
                    var attackDist = calcDist(unit.pos, target.pos)
                    if (unit.range < attackDist) {
                        ws.send("invalid request: attack out of range")
                        return
                    }
                    target.hp -= unit.atk
                }
                var unitsUpdated = []
                for (var unit of gameBoard.units) {
                    if (unit.hp > 0) {
                        unitsUpdated.push(unit)
                    }
                }
                gameBoard.units = unitsUpdated

                advanceGameState(gameBoard)

                wss.clients.forEach(function (client) { //Event: data recieved from client
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            action: "UPDATE",
                            gameBoard: gameBoard
                        }), { binary: isBinary })
                    }
                })
                break
            case 'GET':
                ws.send(JSON.stringify({
                    action : "UPDATE",
                    gameBoard : gameBoard
                }), { binary: isBinary })
                break
            case 'RESET':
                gameBoard = new c.Board()
                setUpBoard(gameBoard)
                numClients = 0;
                wss.clients.forEach(function (client) { //Event: data recieved from client
                    if (client.readyState === WebSocket.OPEN) {
                        numClients += 1
                        client.send(JSON.stringify({
                            action: "ASSIGN",
                            player: "p" + numClients
                        }))
                        client.send(JSON.stringify({
                            action: "UPDATE",
                            gameBoard: gameBoard
                        }))
                    }
                })
            default:
                ws.send("invalid request: unknown action")
                return

        } 

        
    });

});



function setUpBoard(board) {
    board.units.push(
        new c.Knight([2,2], "p1"),
        new c.Knight([7,2], "p1"),
        new c.Archer([0,0], "p1"),
        new c.Archer([9,0], "p1"),
        
        new c.Knight([2,7], "p2"),
        new c.Knight([7,7], "p2"),
        new c.Archer([0,9], "p2"),
        new c.Archer([9,9], "p2"),
    )
    console.log(board)
}

function calcDist(pos1, pos2) {
    var xDist = Math.abs(pos1[0] - pos2[0])
    var yDist = Math.abs(pos1[1] - pos2[1])
    var cSquared = (xDist*xDist + yDist*yDist)
    return Math.sqrt(cSquared)
}

function advanceGameState(gameBoard) {
    if (gameBoard.units.every((unit) => unit.player == "p1")) gameBoard.gameState = "p1win"
    else if (gameBoard.units.every((unit) => unit.player == "p2")) gameBoard.gameState = "p2win"
    else switch (gameBoard.gameState) {
        case "p1move": gameBoard.gameState = "p1atk"; break
        case "p1atk": gameBoard.gameState = "p2move"; break
        case "p2move": gameBoard.gameState = "p2atk"; break
        case "p2atk": gameBoard.gameState = "p1move"; break
    }
}

// function calcTargetArea(unit, targetId) {
//     posList = []
//     x0 = 0
//     x1 = 0
//     y0 = 0
//     y1 = 0
//     switch (targetId) {
//         case 0: // North
//             x0 = unit.pos[0] - 1
//             x1 = unit.pos[0] + 1
//             y0 = unit.pos[1] - unit.range
//             y1 = unit.pos[1] - 1
//             break
//         case 1: // East
//             x0 = unit.pos[0] + 1
//             x1 = unit.pos[0] + unit.range
//             y0 = unit.pos[1] - 1
//             y1 = unit.pos[1] + 1
//             break
//         case 2: // South
//             x0 = unit.pos[0] - 1
//             x1 = unit.pos[0] + 1
//             y0 = unit.pos[1] + 1
//             y1 = unit.pos[1] + unit.range
//             break
//         case 3: // West
//             x0 = unit.pos[0] + 1
//             x1 = unit.pos[0] + unit.range
//             y0 = unit.pos[1] - 1
//             y1 = unit.pos[1] + 1
//             break
//     }
//     for (var x = x0; x <= x1; x++) {
//         for (var y = y0; y <= y1; y++) {
//             posList.push([x, y])
//         }
//     }
//     return posList;
// }

//OLD GUNNER CODE - doesnt work for now
// if (unit instanceof c.Gunner) {
//     targetArea = calcTargetArea(unit, attack.targetId)
//     newUnits = []
//     // for (var pos of targetArea) {
//     //     for(var target of gameBoard.units) {
//     //         if (target.pos[0] == pos[0] && target.pos[1] == pos[1]) {
//     //             target.hp -= unit.atk
//                 // if (target.hp > 0) { // if target does not die, keep in units array
//                 //     newUnits.push(target)
//                 // }
//     //         }
//     //         else {
//     //             newUnits.push(target)
//     //         }
//     //     }
//     // }
//     for (var target of gameBoard.units) {
//         if (targetArea.some((pos) => {target.pos[0] == pos[0] && target.pos[1] == pos[1]})) {
//                 target.hp -= unit.atk
//                 if (target.hp > 0) { // if target does not die, keep in units array
//                     newUnits.push(target)
//                 }
//             } else {
//                 newUnits.push(target)
//             }
//     }
//     gameBoard.units = newUnits     
// }
