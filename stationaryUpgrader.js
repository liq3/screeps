module.exports = {

	run: function (creep) {
		if (creep.makeSureInBossRoom()) {
			return
		}
		var target;
		// if (!creep.memory.finalPos) {
		// 	target = creep.room.controller.pos.findInRange(FIND_STRUCTURES, 2, {filter: {structureType:STRUCTURE_CONTAINER}});
		// 	let terrain = creep.room.getTerrain()
		// 	for (let x = target.pos.x-1; x < target.pos.x+2; x++) {
		// 		for (let y = target.pos.y-1; y < target.pos.y+2; y++) {
		// 			if (terrain.get(x,y) == TERRAIN_MASK_WALL) {
		// 				continue;
		// 			}
		// 			let empty = true
		// 			let pos = creep.room.getPositionAt(x,y);
		// 			for (let thing of pos.lookFor(FIND_STRUCTURES)) {
		// 				if (thing.structureType == STRUCTURE_ROAD) {
		// 					empty = false;
		// 					break;
		// 				}
		// 			}
		// 			if (!empty) {
		// 				continue;
		// 			}
		// 		}
		// 	}
		// }
		var error = creep.transfer(creep.room.controller,RESOURCE_ENERGY);
		if (error == ERR_NOT_IN_RANGE || error == ERR_NOT_ENOUGH_ENERGY) {
			target = creep.room.controller.pos.findInRange(FIND_STRUCTURES, 2, {filter: s=>s.structureType==STRUCTURE_CONTAINER});
			if (target.length > 0) {
				creep.moveTo(target[0], {range: 1, avoid:target.pos.findInRange(FIND_STRUCTURES, {filter:{structureType:STRUCTURE_ROAD}})});
				creep.withdraw(target[0], RESOURCE_ENERGY);
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
