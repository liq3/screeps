module.exports = {

	run: function (creep) {
	    if (creep.pos.roomName == creep.memory.targetRoom) {
	        var target = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
	        if (target == null) {
	            target = creep.pos.findClosestByPath(FIND_HOSTILE_SPAWNS);
	            if (target == null) {
	                target = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES);
	            }
	        }
	        if(target != null) {
				creep.attack(target);
	            creep.moveTo(target);
	        } else {
				creep.moveTo(new RoomPosition(25,25,creep.memory.targetRoom), {range: 22});
			}
	    } else {
	        creep.moveTo(new RoomPosition(25,25,creep.memory.targetRoom), {range: 22});
	    }
	}
};
