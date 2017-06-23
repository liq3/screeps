var harvester = require('harvester');
var upgrader = require('upgrader');
var builder = require('builder');
var guard = require('guard');
var miner = require('miner');
var transporter = requie('transporter');

var sumCreeps = function(role) {
    return _.sum(Game.creeps, (c) => c.memory.role == role);
}
var createCreep = function(parts, roleStr) {
    return Game.spawns.Spawn1.createCreep(parts, null, {role: roleStr, gathering:true});
}

module.exports.loop = function () {

    for(var i in Memory.creeps) {
    if(!Game.creeps[i]) {
        delete Memory.creeps[i];
        }
    }

    var numberHarvesters = sumCreeps('harvester');
    var numberBuilders = sumCreeps ('builder');
    var numberUpgraders = sumCreeps ('upgrader');
    var numberMiners = sumCreeps('miner');
    var numberTransporters = sumCreeps('transporter');

    var source = Game.spawns.Spawn1.room.find(FIND_SOURCES)[0];
    if (numberHarvesters < 1) {
        createCreep([WORK,WORK,CARRY,MOVE], 'harvester');
    } else if (numberMiners < 2) {
        createCreep([WORK,WORK,CARRY,MOVE], 'miner');
    } else if (numberTransporters < 1) {
        createCreep([CARRY,CARRY,CARRY,MOVE,MOVE,MOVE], 'transporter');
    } else if (numberBuilders < 3) {
        createCreep([WORK,WORK,CARRY,MOVE], 'builder');
    } else if (numberUpgraders < 3){
        createCreep([WORK,WORK,CARRY,MOVE], 'upgrader');
    } else {
        createCreep([WORK,WORK,CARRY,MOVE], 'builder');
    }

	for(var name in Game.creeps) {
		var creep = Game.creeps[name];

		if(creep.memory.role == 'harvester') {
			harvester(creep);
		} else if (creep.memory.role == 'upgrader') {
		    upgrader(creep);
		} else if (creep.memory.role == 'builder') {
            builder(creep);
        } else if (crep.memory.role == 'miner') {
            miner(creep);
        } else if (crep.memory.role == 'transporter') {
            transporter(creep);
        }

        if(creep.memory.role == 'guard') {

        }
	}
}
