module.exports = {

	run: function (creep) {
	    if (creep.pos.roomName == creep.memory.targetRoom) {
			let hostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS);
			let hostileTowers = creep.room.find(FIND_HOSTILE_STRUCTURES, {filter: s=>s.structureType == STRUCTURE_TOWER});
	        let target = creep.pos.findClosestByPath(hostileCreeps.concat(hostileTowers));
	        if (!target) {
	            target = creep.pos.findClosestByPath(FIND_HOSTILE_SPAWNS);
			}
	        if (!target) {
                target = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES);
            }
	        if(target) {
				creep.attack(target);
				if (creep.pos.getRangeTo(target) < 3) {
		            let path = PathFinder.search(creep.pos, {pos:target, range:3}, {flee:true});
					creep.moveByPath(path.path);
				} else {
					creep.moveTo(target);
				}
	        } else {
				creep.moveTo(new RoomPosition(25,25,creep.memory.targetRoom), {range: 22});
			}
	    } else {
	        creep.moveTo(new RoomPosition(25,25,creep.memory.targetRoom), {range: 22});
	    }
	}
};
