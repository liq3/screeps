var gatherEnergy = require("creepGatherEnergy");
module.exports = {

	run: function (creep) {
		if (creep.memory.gathering) {
			if (creep.memory.sourceId) {
				let source = Game.getObjectById(creep.memory.sourceId);
				if (source) {
					let target;
					let containers = source.pos.findInRange(FIND_STRUCTURES, 1, {filter: s=>s.structureType == STRUCTURE_CONTAINER});
					var err;
					if (containers.length > 0) {
						target = containers[0];
						err = creep.withDraw(target);
					} else {
						let droppedEnergy = source.pos.findInRange(FIND_DROPPED_RESOURCES, 1, {filter: r=>r.type == RESOURCE_ENERGY});
						if (droppedEnergy.length > 0) {
							target = droppedEnergy[0];
							creep.pickUp(target);
						}
					}
					if (!target) {
						creep.moveTo(source, {range:1});
					} else if (err == ERR_NOT_IN_RANGE) {
						creep.moveTo(target, {range:1});
					}
					if (creep.carry.energy == creep.carryCapacity) {
						creep.memory.gathering = false;
					}
				}
			} else {
				creep.memory.role = 'recycle';
			}
	    } else if (!creep.memory.gathering && creep.carry.energy == 0) {
	        creep.memory.gathering = true;
	    } else if (!creep.memory.gathering && creep.pos.roomName != creep.memory.bossRoom) {
			creep.moveTo(new RoomPosition(25,25,creep.memory.bossRoom), {range:22});
		} else {
			let err;
			if (creep.room.storage) {
				err = creep.transfer(creep.room.storage, RESOURCE_ENERGY);
			} else {
				let target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {range:1, filter: s=> (s.structureType == STRUCTURE_SPAWN || s.structureType == STRUCTURE_EXTENSION) && s.energy < s.energyCapacity})
				if (target) {
					err = creep.transfer(target, RESOURCE_ENERGY);
				}
			}
			if (err == ERR_NOT_IN_RANGE) {
				creep.moveTo(target, {range:1});
			}
		}
	}
};
