Vue.createApp({
data : function () { return {
    BOARD_HEIGHT: 10,
    BOARD_WIDTH: 10,

    clientPlayer : "p1",

    board : {},

    boardDisplay: [],

    actions : [],

    currentAction : "",

    selectedPos : [],
    selectedUnit : {},

    targetPos : []

    }
},

methods : {
    boardReset: function () {
        this.boardDisplay = []
        for (var row = 0; row < this.BOARD_HEIGHT; row++) {
            this.boardDisplay.push([])
            for (var col = 0; col < this.BOARD_WIDTH; col++) {
                this.boardDisplay[row].push({})
            }
        }
        if (this.board.units) for (unit of this.board.units) {
            if (unit.display == "inRange") unit.display = ""
            this.boardDisplay[unit.pos[0]][unit.pos[1]] = unit
        }
        
    },

    // selectionReset: function () {
    //     for (var row = 0; row < this.BOARD_HEIGHT; row++) {
    //         for (var col = 0; col < this.BOARD_WIDTH; col++) {
    //             this.boardDisplay[row][col].display = ""
    //         }
    //     }
    // },

    handleMessage: function (message) {
        console.log(message)
        switch(message.action) {
            case "UPDATE":
                this.board = message.gameBoard
                this.boardReset()
                this.currentAction = this.gameStateToAction(this.board.gameState)
                break
            case "ASSIGN":
                this.clientPlayer = message.player
            default:
                console.log("Unknown Action recieved from server:", message.action, "\n with data:", message)
                break
        }
        
        
    },

    takeAction: function (unit, row, col) {
        if (unit.display == "locked") {
            return
        }
        switch (this.currentAction) {
            case "selectUnitToMove":
                if (unit.player == this.clientPlayer && unit.display != " ") {
                    console.log("taking action:", this.currentAction)
                    this.selectedPos = unit.pos
                    this.selectedUnit = unit
                    this.boardDisplay[row][col].display = "selected"
                    this.displayPossibleMovement(unit)
                    console.log(this.boardDisplay[this.selectedPos[0]][this.selectedPos[1]])
                    this.currentAction = "selectPosition"
                }
                break
            case "selectPosition":
                if (unit.display == "selected") {
                    unit.display = ""
                    this.boardReset()
                    this.currentAction = "selectUnitToMove"
                    return
                }
                if (unit.display == "inRange") {
                    var unitId = this.board.units.findIndex((aUnit) => {
                        return (this.selectedUnit.pos[0] == aUnit.pos[0]) && (this.selectedUnit.pos[1] == aUnit.pos[1])
                      });
                    this.actions.push({
                        "unitId" : unitId,
                        "pos" : [row, col]
                    })

                    this.boardDisplay[this.selectedUnit.pos[0]][this.selectedUnit.pos[1]] = {}
                    this.boardDisplay[row][col] = this.selectedUnit
                    this.selectedUnit.pos = [row,col]
                    this.selectedUnit.display = "locked"
                    this.boardReset()

                    console.log(this.actions)
                    if (this.actions.length < 2) {
                        this.currentAction = "selectUnitToMove"
                    } else {
                        this.currentAction = "submitMove"
                    }
                    console.log("current action:", this.currentAction)
                }
                break
            case "selectUnitToAtk":
                if (unit.player == this.clientPlayer && unit.display != " ") {
                    console.log("taking action:", this.currentAction)
                    this.selectedPos = unit.pos
                    this.selectedUnit = unit
                    this.boardDisplay[row][col].display = "selected"
                    this.displayPossibleTargets(unit)
                    console.log(this.boardDisplay[this.selectedPos[0]][this.selectedPos[1]])
                    this.currentAction = "selectTarget"
                }
                break
            case "selectTarget":
                if (unit.display == "selected") {
                    unit.display = ""
                    this.boardReset()
                    this.currentAction = "selectUnitToAtk"
                    return
                }
                if (unit.display == "inRange") {
                    var unitId = this.board.units.findIndex((aUnit) => {
                        return (this.selectedUnit.pos[0] == aUnit.pos[0]) && (this.selectedUnit.pos[1] == aUnit.pos[1])
                    })
                    var targetId = this.board.units.findIndex((aUnit) => {
                        return (row == aUnit.pos[0]) && (col == aUnit.pos[1])
                    })
                    console.log(targetId)
                    this.actions.push({
                        "unitId" : unitId,
                        "targetId" : targetId
                    })

                    // this.boardDisplay[this.selectedUnit.pos[0]][this.selectedUnit.pos[1]] = {}
                    // this.boardDisplay[row][col] = this.selectedUnit
                    // this.selectedUnit.pos = [row,col]
                    this.selectedUnit.display = "locked"
                    this.boardDisplay[row][col].display = "target"
                    this.boardReset()

                    console.log(this.actions)
                    if (this.actions.length < 2) {
                        this.currentAction = "selectUnitToAtk"
                    } else {
                        this.currentAction = "submitAttack"
                    }
                    console.log("current action:", this.currentAction)
                }
                break
            default:

                break
        }

    },

    displayPossibleMovement: function (unit) {
        for (var row = 0; row < this.BOARD_HEIGHT; row++) {
            for (var col = 0; col < this.BOARD_WIDTH; col++) {
                dist = calcDist(unit.pos, [row, col])
                if (dist <= unit.spd && !this.boardDisplay[row][col].type) {
                    this.boardDisplay[row][col].display = "inRange"
                }
            }
        }
    },

    displayPossibleTargets: function (unit) {
        console.log("displaying possible targets")
        for (var row = 0; row < this.BOARD_HEIGHT; row++) {
            for (var col = 0; col < this.BOARD_WIDTH; col++) {
                dist = calcDist(unit.pos, [row, col])
                if (dist <= unit.range) {
                    console.log("displaying possible targets")
                    console.log(unit)
                }
                if (dist <= unit.range && this.boardDisplay[row][col].type && this.boardDisplay[row][col].player != this.clientPlayer ) {
                    this.boardDisplay[row][col].display = "inRange"
                }
            }
        }
    },

    gameStateToAction: function (gameState) {
        switch (gameState) {
            case this.clientPlayer + "move":
                return "selectUnitToMove"
            case this.clientPlayer + "atk":
                return "selectUnitToAtk"
            default:
                return "waitTurn"
        }

    },

    sendMessage: function () {
        if (this.moving) {
            msg = JSON.stringify({
                action : 'MOVE',
                moves : this.actions
            })
        } else if (this.attacking) {
            msg = JSON.stringify({
                action : 'ATTACK',
                attacks : this.actions
            })
        }
        this.socket.send(msg)
        this.actions = []
    },

    requestBoard: function () {
        msg = JSON.stringify({
            action : 'GET'
        })
        this.socket.send(msg)
        this.actions = []
    },

    calcHealthBarWidth: function (unit) {
        var tempWidth = ((unit.hp / unit.maxhp * 100) + '%')
        console.log(tempWidth)
        return tempWidth
    }

},

computed :  {
    canAttack: function () {
        return !this.gameBoard.units.every((unit) => {
                //.every returns false if any unit is able to attack
                //result is flipped to describe whether the player is able to attack
                //if any unit is able to attack, player is able to attack
            for (target of gameBoard.units) {
                if (target.player != clientPlayer) return true;
                if (unit.display != "locked") return true;
                if (calcDist(unit.pos, target.pos) > unit.range) return true;
                return false;
            }
        })
    },

    moving: function () {
        switch (this.currentAction) {
            case "selectUnitToMove": return true
            case "selectPosition": return true
            case "submitMove": return true
            default: return false
        }
    },

    attacking: function () {
        switch (this.currentAction) {
            case "selectUnitToAtk": return true
            case "selectTarget": return true
            case "submitAttack": return true
            default: return false
        }
    },

    displaySubmit: function () {
        switch (this.currentAction) {
            case "selectUnitToMove": return true
            case "selectUnitToAtk": return true
            case "submitMove": return true
            case "submitAttack": return true
            default: return false
        }
    },

    displayUndo: function () {
        switch (this.currentAction) {
            case "waitTurn": return false
            default: return true
        }
    },

    prompt: function () {
        if (!this.board.gameState) return "Not connected to server"

        switch (this.board.gameState) {
            case this.clientPlayer + "move":
                return "Your turn to Move!"
            case this.clientPlayer + "atk":
                return "Your turn to Attack!"
            case this.clientPlayer + "win":
                return "You Win!"
            case "p1move": case "p2move":
                return "Other player is moving"
            case "p1atk": case "p2atk":
                return "Other player is attacking"
            case "p1win": case "p2win":
                return "Other player has won."
            default:
                return ""
        }
    },

    teamColor: function () {
        switch (this.clientPlayer) {
            case "p1": return "Orange"
            case "p2": return "Blue"
        }
    }
    
},

created : function () {
    this.boardReset()
    this.socket = new WebSocket("ws://localhost:8080")
    this.socket.onmessage = (event) => {
        console.log(event)
        this.handleMessage(JSON.parse(event.data))
    }
}

}).mount("#app")


function calcDist(pos1, pos2) {
    var xDist = Math.abs(pos1[0] - pos2[0])
    var yDist = Math.abs(pos1[1] - pos2[1])
    var cSquared = (xDist*xDist + yDist*yDist)
    return Math.sqrt(cSquared)
}