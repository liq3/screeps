var gatherEnergy = require("creepGatherEnergy");
module.exports = {

	run: function (creep) {
    var chooseTarget = function() {
        var targets = creep.room.find(FIND_MY_CREEPS, {filter:
            c => c.memory.role == 'stationaryUpgrader'});
        if (targets.length > 0) {
            var best = targets[0];
            for (let i of targets) {
                if (i.carry.energy < best.carry.energy) {
                    best = i;
                }
            }
            return best;
        } else {
            return null;
        }
    }

	if(creep.memory.gathering && creep.carry.energy < creep.carryCapacity) {
		gatherEnergy(creep);
	} else if (creep.memory.gathering && creep.carry.energy == creep.carryCapacity) {
        creep.memory.gathering = false;
    } else if (!creep.memory.gathering && creep.carry.energy == 0) {
        creep.memory.gathering = true;
    } else {
        var target = Game.getObjectById(creep.memory.targetId);
        if (target == null) {
            target = chooseTarget();
            if (target != null) {
                creep.memory.targetId = target.id;
            }
        }
        if (target != null) {
            var error = creep.transfer(target, RESOURCE_ENERGY);
            if (error == ERR_NOT_IN_RANGE) {
               creep.moveTo(target);
           }
           if (target.carry.energy > target.carryCapacity * 0.9) {
               creep.memory.targetId = chooseTarget().id;
           }
        }
	}
}};
