var harvester = require('harvester');
var upgrader = require('upgrader');
var builder = require('builder');
var guard = require('guard');

var sumCreeps = function(role) {
    return _.sum(Game.creeps, (c) => c.memory.role == role);
}

module.exports.loop = function () {

    for(var i in Memory.creeps) {
    if(!Game.creeps[i]) {
        delete Memory.creeps[i];
        }
    }

    var numberHarvesters = sumCreeps('harvester');
    var numberBuilders = sumCreeps ('builder');
    var numberUpgraders = sumCreeps ('upgraders');

    var source = Game.spawns.Spawn1.room.find(FIND_SOURCES)[0];
    if (numberHarvesters < 3) {
        Game.spawns.Spawn1.createCreep([WORK,WORK,CARRY,MOVE],null,{role: 'harvester', gathering:true});
    } else if (numberBuilders < 3) {
        Game.spawns.Spawn1.createCreep([WORK,CARRY,CARRY,MOVE,MOVE],null,{role: 'builder', gathering:true});
    } else {
        Game.spawns.Spawn1.createCreep([WORK,CARRY,CARRY,MOVE,MOVE],null,{role: 'upgrader', gathering:true});
    }

	for(var name in Game.creeps) {
		var creep = Game.creeps[name];

		if(creep.memory.role == 'harvester') {
			harvester(creep);
		} else if (creep.memory.role == 'upgrader') {
		    upgrader(creep);
		} else if (creep.memory.role == 'builder') {
            builder(creep);
        }

        if(creep.memory.role == 'guard') {

        }
	}
}
