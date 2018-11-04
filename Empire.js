global.Empire = {}

Empire.getOwnedRooms = function() {
    let rooms = []
    for (let r in Game.rooms) {
        if (Game.rooms[r] && Game.rooms[r].controller && Game.rooms[r].controller
            && ((Game.rooms[r].controller.reservation && Game.rooms[r].controller.reservation.username === Memory.username)
                || Game.rooms[r].controller.my)) {
            rooms.push(Game.rooms[r])
        }
    }
    return rooms
}

Empire.costMatrixCallback = function(roomName, costMatrix) {
    if (Memory.rooms[roomName] && Memory.rooms[roomName].hostile) {
        return false;
    }

    if (Game.rooms[roomName]) {
        for (let structure of Game.rooms[roomName].find(FIND_STRUCTURES)) {
            if (structure.structureType === STRUCTURE_ROAD) {
                if (costMatrix.get(structure.pos.x, structure.pos.y) === 0) {
                    costMatrix.set(structure.pos.x, structure.pos.y, 1);
                }
            } else if (!(structure.structureType === STRUCTURE_RAMPART || structure.structureType === STRUCTURE_CONTAINER)) {
                costMatrix.set(structure.pos.x, structure.pos.y, 255);
            }
        }

        let keepers = Game.rooms[roomName].find(FIND_HOSTILE_CREEPS, {filter: {owner:'Source Keeper'}})
        for (let keeper of keepers) {
            for (let x = keeper.pos.x-3; x < keeper.pos.x+4; x++) {
                for (let y = keeper.pos.y-3; y < keeper.pos.y+4; y++) {
                    costMatrix.set(x,y,255);
                }
            }
        }
    }
    return costMatrix;
}
