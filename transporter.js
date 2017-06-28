var gatherEnergy = require("creepGatherEnergy");
module.exports = {

	run: function (creep) {
		if (creep.memory.gathering) {
			if (creep.memory.sourcePos && creep.memory.sourcePos.roomName == creep.pos.roomName) {
				let energy = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
					filter: r => r.resourceType == RESOURCE_ENERGY && creep.pos.inRangeTo(r,2)});
				if (energy) {
					if (creep.pickup(energy) == ERR_NOT_IN_RANGE) {
						creep.moveTo(energy);
					}
				} else {
				    let {x,y,roomName} = creep.memory.sourcePos;
					creep.moveTo(new RoomPosition(x,y,roomName), {range:2});
				}
				if (creep.carry.energy == creep.carryCapacity) {
		        	creep.memory.gathering = false;
				}
			} else if (creep.memory.sourcePos && creep.pos.roomName != creep.memory.sourcePos.roomName) {
			    let	{x,y,roomName} = creep.memory.sourcePos;
				creep.moveTo(new RoomPosition(x,y,roomName));
			} else if (creep.carry.energy == creep.carryCapacity) {
	        	creep.memory.gathering = false;
			}
	    } else if (!creep.memory.gathering && creep.carry.energy == 0) {
	        creep.memory.gathering = true;
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
			//if (debug) console.log(target);
	        if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
	            creep.moveTo(target);
	        }
		}
	}
};
