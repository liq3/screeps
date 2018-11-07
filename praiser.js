module.exports = {

	run: function (creep) {
		var target;
		if (creep.memory.finalPos === null) {
			target = creep.room.controller.link || creep.room.controller.container;
			let terrain = creep.room.getTerrain()
			let possiblePositions = {}
			for (let x = target.pos.x-1; x < target.pos.x+2; x++) {
				for (let y = target.pos.y-1; y < target.pos.y+2; y++) {
					if (terrain.get(x,y) != TERRAIN_MASK_WALL && target.pos.inRangeTo(x,y,3)
						&& !_.filter(creep.room.lookForAt(FIND_STRUCTURES,x,y), s=>s.structureType !== STRUCTURE_CONTAINER).length) {
						possiblePositions[`${x}_${y}`] = true
					}
				}
			}
			for (let otherCreep of creep.room.find(FIND_MY_CREEPS, {filter: c=> c.memory.role=='praiser'})) {
				if (otherCreep.memory.finalPos) {
					possiblePositions[`${otherCreep.memory.finalPos.x}_${otherCreep.memory.finalPos.y}`] = false
				} else if (otherCreep.memory.finalPos === undefined) {
					possiblePositions[`${otherCreep.pos.x}_${otherCreep.pos.y}`] = false
				}
			}
			for (let pos in possiblePositions) {
				if (possiblePositions[pos]) {
					let xy = pos.split("_")
					creep.memory.finalPos = {x:parseInt(xy[0]), y:parseInt(xy[1])}
					break;
				}
			}
		}
		if (creep.memory.finalPos === undefined) {
			let controller = creep.room.controller
			var error = creep.upgradeController(controller,RESOURCE_ENERGY);
			if (error === ERR_NOT_ENOUGH_ENERGY || creep.carry.energy < creep.getActiveBodyparts(WORK)) {
				let err = creep.withdraw(controller.link, RESOURCE_ENERGY);
				if (err === ERR_NOT_ENOUGH_ENERGY || err === ERR_INVALID_TARGET) {
					creep.withdraw(controller.container, RESOURCE_ENERGY);
				} else if (err != OK) {
					log(`Creep ${creep.url}: ${err} withdrawing from container`)
				}
			}
		} else if (creep.memory.finalPos) {
			let pos = creep.memory.finalPos
			if (creep.pos.isEqualTo(pos.x,pos.y)) {
				creep.room.controller.memory.rate = creep.room.controller.memory.rate + creep.getActiveBodyparts(WORK) || creep.getActiveBodyparts(WORK);
				delete creep.memory.finalPos;
			} else {
				target = new RoomPosition(pos.x, pos.y, creep.memory.bossRoom)
				creep.moveTo(target)
			}
		} else {
			log(`Creep ${creep.url}: Error getting final position near controller`)
		}
	},

	death: function(creep) {
		Game.rooms[creep.memory.bossRoom].controller.memory.rate -= creep.body.filter(x=>x.type===WORK).length;
	}
};
