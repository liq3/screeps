var gatherEnergy = require("creepGatherEnergy");
module.exports = {

	run: function (creep) {
		if (creep.memory.gathering) {
			if (creep.memory.targetId) {
				let target = Game.getObjectById(creep.memory.targetId);
				if (target) {
					let err;
					if (target instanceof Resource) {
						err = creep.pickup(target);
					}
					if (err == 0) {
						Memory.energyPush[creep.memory.targetId].reserved -= creep.memory.reserved;
					}
					if (err == ERR_NOT_IN_RANGE) {
						creep.moveTo(target);
					}
				} else {
					delete creep.memory.targetId;
				}
			} else {
				if (Object.keys(Memory.energyPush).length > 0) {
					let best = {id:null, cost:1000};
					for (let id in Memory.energyPush) {
					    console.log(id);
						let possible = Game.getObjectById(id);
						if (possible) {
						    let path = PathFinder.search(creep.pos, {pos:possible.pos, range:1});
							let cost = path.cost * 4 - possible.amount + Memory.energyPush[id].reserved;
    						if (cost < best.cost) {
    							best.id = id;
    							best.cost = path.cost;
    						}
						}
					}
					creep.memory.targetId = best.id;
					creep.memory.reserved = creep.carryCapacity - creep.carry.energy;
					Memory.energyPush[best.id].reserved += creep.memory.reserved;
				}
			}
			if (creep.carry.energy == creep.carryCapacity) {
	        	creep.memory.gathering = false;
				creep.memory.targetId = null;
			}
	    } else if (!creep.memory.gathering && creep.carry.energy == 0) {
	        creep.memory.gathering = true;
			creep.memory.targetId = null;
	    } else if (creep.room != Game.spawns.Spawn1.room) {
			creep.moveTo(Game.spawns.Spawn1);
		} else {
			var target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter:
				s => s.structureType == STRUCTURE_TOWER && s.energy < s.energyCapacity});
	        if (target == null) {
				target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter:
	            	s => s.structureType == STRUCTURE_EXTENSION && s.energy < s.energyCapacity});
			}
			if (target == null && Game.spawns.Spawn1.energy < Game.spawns.Spawn1.energyCapacity) {
	            target = Game.spawns.Spawn1;
	        } else if (target == null) {
				target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter:
		            s => s.structureType == STRUCTURE_STORAGE &&
		                _.sum(s.store) < s.storeCapacity});
			}
			if (!target) {
				creep.moveTo(Game.spawns.Spawn1, {range: 3});
				if (creep.pos.inRangeTo(Game.spawns.Spawn1.pos, 5)) {
					creep.drop(RESOURCE_ENERGY);
				}
			}
			//if (debug) console.log(target);
	        if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
	            creep.moveTo(target);
	        }
		}
	}
};
