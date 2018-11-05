module.exports = {

	run: function (creep) {
		if (creep.makeSureInBossRoom()) {
			return
		}
		var target;
		if (!creep.memory.finalPos) {
			target = creep.room.controller.container;
			let terrain = creep.room.getTerrain()
			let possiblePositions = {}
			for (let x = target.pos.x-1; x < target.pos.x+2; x++) {
				for (let y = target.pos.y-1; y < target.pos.y+2; y++) {
					if (terrain.get(x,y) != TERRAIN_MASK_WALL && target.pos.inRangeTo(x,y,3)) {
						possiblePositions[`${x}_${y}`] = true
					}
				}
			}
			for (let thing of target.pos.findInRange(FIND_STRUCTURES, 1, {filter:{structureType:STRUCTURE_ROAD}})) {
				possiblePositions[`${thing.pos.x}_${thing.pos.y}`] = false
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
				var error = creep.transfer(controller,RESOURCE_ENERGY);
				if (error === ERR_NOT_ENOUGH_ENERGY || creep.carry.energy < creep.getActiveBodyparts(WORK)) {
					let err = creep.withdraw(controller.container, RESOURCE_ENERGY);
					if (err === ERR_NOT_ENOUGH_ENERGY) {
						let err = creep.withdraw(controller.link, RESOURCE_ENERGY);
					} else if (err != OK) {
						console.log(`Creep ${creep.name}: ${err} withdrawing from container`)
					}
				}
			} else {
				target = new RoomPosition(pos.x, pos.y, creep.room.name)
				creep.moveTo(target)
			}
		} else {
			console.log(`Creep ${creep.name}: Error getting final position near controller`)
		}
	}
};
