const spawnManager = require('spawnManager');

module.exports = {
	run: function(room) {
		if (Empire.deadCreeps.length) {
			let done = []
			for (let name of Empire.deadCreeps) {
				let tombstone = room.find(FIND_TOMBSTONES, {filter: t=>t.creep.name === name})
				if (tombstone.length) {
					creepFunctions[Memory.creeps[name].role].death(tombstone[0].creep);
					delete Memory.creeps[name];
					done.push(name)
				}
			}
			for (let name of done) {
				Empire.deadCreeps.splice(Empire.deadCreeps.indexOf(name), 1)
			}
		}

		if (room.controller && !room.controller.my) {
			let danger = false;
			let hostileCreeps = room.find(FIND_HOSTILE_CREEPS);
			for (let creep of hostileCreeps) {
				if (creep.getActiveBodyparts(ATTACK) > 0 || creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
					danger = true;
					break;
				}
			}
			if (danger && !Memory.dangerRooms.includes(room.name)) {
				log(room + " is dangerous!"),
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

		if (room.controller && room.controller.my && Game.cpu.bucket > 7000
		&& room.find(FIND_MY_STRUCTURES, {filter: s => s.structureType === STRUCTURE_SPAWN && !s.spawning})[0] != undefined) {
			spawnManager.spawnCreepsTest(room);
		}

		if (room.memory.plannedRoads && room.memory.plannedRoads.length && _.size(Game.constructionSites) < 20) {
			for (let i = 0; i < 5; i++) {
				let {x,y,type} = room.memory.plannedRoads.pop()
				if (!_.any(room.lookForAt( FIND_STRUCTURES, x,y), {stuctureType:STRUCTURE_RAMPART})) {
					room.createConstructionSite(x,y,type)
				}
				if (!room.memory.plannedRoads.length) {
					break;
				}
			}
		}
	}
};
