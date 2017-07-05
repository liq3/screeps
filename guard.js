module.exports = {

    run: function (creep) {
        var target = Game.getObjectById(creep.memory.targetId);
        if (!target) {
            for (let r in Memory.ownedRooms) {
                for (let room of Memory.ownedRooms[r]) {
                    if (Game.rooms[room] && !target) {
                        let possibleTargets = Game.rooms[room].find(FIND_HOSTILE_CREEPS);
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
