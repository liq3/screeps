module.exports = {

	run: function (creep) {
        var target = Game.getTargetById(creep.memory.targetId);
        if (!target) {
            for (let r of Memory.searchRooms) {
                for (let room of Memory.searhRooms[r]) {
                    if (Game.rooms[room] && !target) {
                        let possibleTargets = Game.rooms[rooms].find(FIND_HOSTILE_CREEPS);
                        if (possibleTargets.length > 0) {
                            target = possibleTargets[0];
                            creep.memory.targetId = target.id;
                        }
                    }
                }
            }
        }
        if (target) {
            if (creep.attack(target) != OK) {
                creep.heal(creep);
            }
            creep.moveTo(target);
        } else if (creep.hits < creep.hitsMax) {
            creep.heal(creep);
        }
	}
};
