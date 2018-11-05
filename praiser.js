module.exports = {

	run: function (creep) {
		var target;
		if (!creep.memory.finalPos) {
			target = creep.room.controller.link || creep.room.controller.container;
			let terrain = creep.room.getTerrain()
			let possiblePositions = {}
			for (let x = target.pos.x-1; x < target.pos.x+2; x++) {
				for (let y = target.pos.y-1; y < target.pos.y+2; y++) {
					if (terrain.get(x,y) != TERRAIN_MASK_WALL && target.pos.inRangeTo(x,y,3) && !_.filter(room.lookForAt(FIND_STRUCTURES,x,y), s=>s.structureType !== STRUCTURE_CONTAINER).length) {
						possiblePositions[`${x}_${y}`] = true
					}
				}
			}
			for (let otherCreep of creep.room.find(FIND_MY_CREEPS, {filter: c=> c.memory.role=='praiser'})) {
				if (otherCreep.memory.finalPos) {
					possiblePositions[`${otherCreep.memory.finalPos.x}_${otherCreep.memory.finalPos.y}`] = false
				}
			}
			for (let pos in possiblePositions) {
				if (possiblePositions[pos]) {
					xy = pos.split("_")
					creep.memory.finalPos = {x:parseInt(xy[0]), y:parseInt(xy[1])}
					break;
				}
			}
		}
		if (creep.memory.finalPos) {
			pos = creep.memory.finalPos
			if (creep.pos.isEqualTo(pos.x,pos.y)) {
				let controller = creep.room.controller
				var error = creep.upgradeController(controller,RESOURCE_ENERGY);
				if (error === ERR_NOT_ENOUGH_ENERGY || creep.carry.energy < creep.getActiveBodyparts(WORK)) {
					let err = creep.withdraw(controller.link, RESOURCE_ENERGY);
					if (err === ERR_NOT_ENOUGH_ENERGY || err === ERR_INVALID_TARGET) {
						let err = creep.withdraw(controller.container, RESOURCE_ENERGY);
					} else if (err != OK) {
						log(`Creep ${creep.name}: ${err} withdrawing from container`)
					}
				}
			} else {
				target = new RoomPosition(pos.x, pos.y, creep.room.name)
				creep.moveTo(target)
			}
		} else {
			log(`Creep ${creep.name}: Error getting final position near controller`)
		}
	}
};
