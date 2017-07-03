var gatherEnergy = require("creepGatherEnergy");
module.exports = {

	run: function (creep) {
		if (creep.memory.gathering) {
			if (creep.memory.sourceId) {
				let source = Game.getObjectById(creep.memory.sourceId);
				if (source) {
					let target;
					let containers = source.pos.findInRange(FIND_STRUCTURES, 1, {filter: s=>s.structureType == STRUCTURE_CONTAINER && s.energy > 0});
					var err;
					if (containers.length > 0) {
						target = containers[0];
						err = creep.withdraw(target, RESOURCE_ENERGY);
						if (err == OK && creep.carryCapacity - creep.carry.energy < target.store[RESOURCE_ENERGY]) {
							creep.memory.gathering = false;
						}
					} else {
						let droppedEnergy = source.pos.findInRange(FIND_DROPPED_RESOURCES, 1, {filter: r=>r.resourceType == RESOURCE_ENERGY});
						if (droppedEnergy.length > 0) {
							target = droppedEnergy[0];
							err = creep.pickup(target);
							if (err == OK && creep.carryCapacity - creep.carry.energy < target.amount) {
								creep.memory.gathering = false;
							}
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
			if (creep.memory.bossRoom) {
				creep.moveTo(new RoomPosition(25,25,creep.memory.bossRoom), {range:22});
			} else {
			    creep.memory.role = 'recycle';
			}
		} else {
			let err;
			let target;
			if (creep.room.storage) {
			    target = creep.room.storage;
				err = creep.transfer(target, RESOURCE_ENERGY);
				if (err == OK) {
					creep.memory.gathering = true;
				}
			} else {
				target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {range:1, filter: s=> (s.structureType == STRUCTURE_SPAWN || s.structureType == STRUCTURE_EXTENSION) && s.energy < s.energyCapacity})
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
