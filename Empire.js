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

Empire.getPathCost = function(a,b) {
    [a,b] = [a,b].sort()

    if (Memory.pathCosts[a] &&  Memory.pathCosts[a][b] && Memory.pathCosts[a][b].time > Game.time) {
        return Memory.pathCosts[a][b].cost;
    }

    [a,b] = [a,b].map(i=>Game.getObjectById(i))
    for (let v of [a,b]) {
        if (!v) {
            return;
        }
    }

    let path = PathFinder.search(a.pos, {pos:b.pos, range:1}, {roomCallback:Empire.costMatrixCallback, swampCost:2, plainsCost:2,maxOps:5000});
    if (!Memory.pathCosts[a.id]) {
        Memory.pathCosts[a.id] = {}
    }
    if (path.incomplete) {
        if (!Memory.pathCosts[a][b]) {
            Memory.pathCosts[a][b] = {cost:path.cost, time:Game.time + 100};
        } else {
            Memory.pathCosts[a][b] = Game.time + 100;
        }
        console.log(`Incomplete path: ${JSON.stringify(a.pos)} to ${JSON.stringify(b.pos)}`)
    } else {
        let pathTime = 50000;
        for (let pos of path.path) {
            let road = false
            for (let s of pos.lookFor(FIND_STRUCTURES)) {
                if (s.structureType === STRUCTURE_ROAD) {
                    road = true;
                }
            }
            if (!road) {
                pathTime = 1000;
                break;
            }
        }
        Memory.pathCosts[a.id][b.id] = {cost:path.cost, time:Game.time + pathTime}
    }
    return path.cost;
}
