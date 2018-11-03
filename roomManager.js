const spawnManager = require('spawnManager');

module.exports = {
    run: function(room) {
        if (Game.rooms[room] && Game.rooms.controller && !Game.rooms[room].controller.my) {
            let danger = false;
            let hostileCreeps = Game.rooms[room].find(FIND_HOSTILE_CREEPS);
            for (let creep of hostileCreeps) {
                if (creep.getActiveBodyparts(ATTACK) > 0 || creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
                    danger = true;
                    break;
                }
            }
            if (danger && !Memory.dangerRooms.includes(room)) {
                console.log(room + " is dangerous!")
                Memory.dangerRooms.push(room);
            } else if (!danger && Memory.dangerRooms.includes(room)){
                Memory.dangerRooms.splice(Memory.dangerRooms.indexOf(room), 1);
            }
        }

        for (let source of room.find(FIND_SOURCES)) {
            if (source.link && room.controller.link && source.link.cooldown === 0 && source.link.energy > 400
                    && source.link.energy <= room.controller.link.energyCapacity - room.controller.link.energy) {
                source.link.transferEnergy(room.controller.link)
            }
        }

        if (room.controller && room.controller.my && Game.cpu.bucket > 1000
        && room.find(FIND_MY_STRUCTURES, {filter: s => s.structureType === STRUCTURE_SPAWN && !s.spawning})[0] != undefined) {
            spawnManager.spawnCreeps(room);
        }

        while (room.memory.plannedRoads && _.size(Game.constructionSites) < 20) {
            let site = room.memory.plannedRoads.pop()
            room.createConstructionSite(...Object.values(site))
        }
    }
};
