var harvester = require('harvester');
var upgrader = require('upgrader');

module.exports.loop = function () {

    var source = Game.spawns.Spawn1.room.find(FIND_SOURCES)[0];
    if (source.pos.findInRange(FIND_MY_CREEPS,1).length == 0 && Game.spawns.Spawn1.pos.findInRange(FIND_MY_CREEPS,1).length < 1) {
        if (Game.creeps.length < 2) {
            Game.spawns.Spawn1.createCreep([WORK,CARRY,MOVE],null,{role: 'harvester'});
        } else {
            Game.spawns.Spawn1.createCreep([WORK,CARRY,CARRY,MOVE,MOVE],null,{role: 'upgrader'});
        }
    }

	for(var name in Game.creeps) {
		var creep = Game.creeps[name];

		if(creep.memory.role == 'harvester') {
			harvester(creep);
		} else if (creep.memory.role == 'upgrader') {
		    upgrader(creep);
		}


		if(creep.memory.role == 'builder') {

			if(creep.carry.energy == 0) {
				if(Game.spawns.Spawn1.transfer(creep,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
					creep.moveTo(Game.spawns.Spawn1);
				}
			}
			else {
				var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
				if(targets.length) {
					if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
						creep.moveTo(targets[0]);
					}
				}
			}
		}
        if(creep.memory.role == 'guard') {
        	var targets = creep.room.find(FIND_HOSTILE_CREEPS);
        	if(targets.length) {
        		if(creep.attack(targets[0]) == ERR_NOT_IN_RANGE) {
        			creep.moveTo(targets[0]);
        		}
        	}
        }
	}
}
