const spawnManager = require('spawnManager');

module.exports = {
    run: function(room) {
        if (rooms.controller && !room.controller.my) {
            let danger = false;
            let hostileCreeps = room.find(FIND_HOSTILE_CREEPS);
            for (let creep of hostileCreeps) {
                if (creep.getActiveBodyparts(ATTACK) > 0 || creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
                    danger = true;
                    break;
                }
            }
            if (danger && !Memory.dangerRooms.includes(room.name)) {
                console.log(room + " is dangerous!")
                Memory.dangerRooms.push(room.name);
            } else if (!danger && Memory.dangerRooms.includes(room.name)){
                Memory.dangerRooms.splice(Memory.dangerRooms.indexOf(room.name), 1);
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

        while (room.memory.plannedRoads && room.memory.plannedRoads.length && _.size(Game.constructionSites) < 20) {
            let [x,y,type] = room.memory.plannedRoads.pop()
            if (!_.any(room.lookForAt( FIND_STRUCTURES, x,y), {stuctureType:STRUCTURE_RAMPART})) {
                room.createConstructionSite(site)
            }
        }
    }
};
