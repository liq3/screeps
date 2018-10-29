module.exports = {

	run: function (creep) {
		if (creep.makeSureInBossRoom()) {
			return
		}
		var target;
		if (!creep.memory.finalPos) {
			target = creep.room.controller.pos.findInRange(FIND_STRUCTURES, 2, {filter: {structureType:STRUCTURE_CONTAINER}});
			let terrain = creep.room.getTerrain()
			let possiblePositions = {}
			for (let x = target.pos.x-1; x < target.pos.x+2; x++) {
				for (let y = target.pos.y-1; y < target.pos.y+2; y++) {
					if (terrain.get(x,y) != TERRAIN_MASK_WALL) {
						possiblePositions[`${x}_${y}`] = true
					}
				}
			}
			for (let thing of pos.lookFor(FIND_STRUCTURES)) {
				if (thing.structureType == STRUCTURE_ROAD) {
					possiblePositions[`${x}_${y}`] = false
				}
			}
			for (let otherCreep of creep.room.find(FIND_MY_CREEPS, {filter: c=> c.memory.role=='stationaryUpgrader'})) {
				possiblePositions[`${otherCreep.memory.finalPos.x}_${otherCreep.memory.finalPos.y}`] = false
			}
			for (let pos in possiblePositions) {
				if (possiblePositions[pos]) {
					xy = pos.split("_")
					creep.memory.finalPos = {x:parseInt(xy[0]), y:parseInt(xy[1])}
				}
			}
			if (creep.memory.finalPos) {
				pos = creep.memory.finalPos
				target = new RoomPosition(pos.x, pos.y, creep.room.name)
			} else {
				console.log(`Creep ${creep.name}: Error getting final position near controller`)
			}
		}
		var error = creep.transfer(creep.room.controller,RESOURCE_ENERGY);
		if (error == ERR_NOT_IN_RANGE || error == ERR_NOT_ENOUGH_ENERGY) {
			if (target) {
				creep.moveTo(target, {range: 1});
				creep.withdraw(target, RESOURCE_ENERGY);
			} else {
				creep.moveTo(creep.room.controller, {range: 2});
			}
		}
		if (creep.carry.energy < 20) {
			if (!target) {
				target = creep.pos.findInRange(FIND_STRUCTURES, 1, {filter: s=>s.structureType==STRUCTURE_CONTAINER});
			}
			if (target.length > 0) {
				creep.withdraw(target[0], RESOURCE_ENERGY);
			}
		}
	}
};
