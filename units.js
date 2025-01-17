class Board {
    constructor() {
        this.gameState = "p1move", // can be "p1move", "p1atk", "p2move", "p2atk", "p1win", "p2win"
                                   // determines turn and whether game is over
        this.units = []
    }
}

class Unit {
    constructor(maxhp, hp, atk, range, spd, pos, player) {   
        this.maxhp = maxhp// int, maximum health points
        this.hp = hp, // int, current health points
        this.atk = atk, // int, attack value
        this.range = range // int, attack range
        this.spd = spd, // int, speed value
        this.pos = pos // [int, int], position on board
        this.player = player // id of player who owns the unit
    }
}

class Knight extends Unit {
    constructor(pos, player) {
        super(100, 100, 30, 1.5, 3, pos, player)
    }

    toJSON() {
        var returnJSON = {}
        for (var i in this) {
            returnJSON[i] = this[i]
        }
        returnJSON.type = "knight"
        return returnJSON
    }
}

// class Gunner extends Unit {
//     constructor(pos, player) {
//         super(70, 70, 30, 3, 2, pos, player)
//     }

//     toJSON() {
//         var returnJSON = {}
//         for (var i in this) {
//             returnJSON[i] = this[i]
//         }
//         returnJSON.type = "gunner"
//         return returnJSON
//     }
// }

class Archer extends Unit {
    constructor(pos, player) {
        super(50, 50, 25, 4.5, 3.5, pos, player)
    }

    toJSON() {
        var returnJSON = {}
        for (var i in this) {
            returnJSON[i] = this[i]
        }
        returnJSON.type = "archer"
        return returnJSON
    }
}

module.exports = {
    Board : Board,
    Knight : Knight,
    // Gunner : Gunner,
    Archer : Archer
}