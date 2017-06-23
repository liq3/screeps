var harvester = require('harvester');
var upgrader = require('upgrader');
var builder = require('builder');
var guard = require('guard');
var miner = require('miner');
var transporter = require('transporter');

var sumCreeps = function(role) {
    return _.sum(Game.creeps, c => c.memory.role == role);
}
var createCreep = function(parts, name, roleStr) {
    return Game.spawns.Spawn1.createCreep(parts, name, {role: roleStr, gathering:true});
}

var getName = function(name, num) {
    if (!((name + num) in Game.creeps)) {
        return name + num;
    } else {
        return getName(name, num+1);
    }
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
    if (numberHarvesters < 1 && (numberMiners == 0 || numberTransporters == 0)) {
        createCreep([WORK,WORK,CARRY,MOVE], getName('Harvester ', 0), 'harvester');
    } else if (numberMiners < 2) {
        createCreep([WORK,WORK,CARRY,MOVE], getName('Miner ', 0), 'miner');
    } else if (numberTransporters < 2) {
        createCreep([CARRY,CARRY,CARRY,MOVE,MOVE,MOVE], getName('Transporter ', 0), 'transporter');
    } else if (numberBuilders < 3) {
        createCreep([WORK,WORK,CARRY,MOVE], getName('Builder ', 0), 'builder');
    } else if (numberUpgraders < 3){
        createCreep([WORK,WORK,CARRY,MOVE], getName('Upgrader ', 0), 'upgrader');
    } else {
        createCreep([WORK,WORK,CARRY,MOVE], getName('Builder ', 0), 'builder');
    }

	for(var name in Game.creeps) {
		var creep = Game.creeps[name];

		if(creep.memory.role == 'harvester') {
			harvester(creep);
		} else if (creep.memory.role == 'upgrader') {
		    upgrader(creep);
		} else if (creep.memory.role == 'builder') {
            builder(creep);
        } else if (creep.memory.role == 'miner') {
            miner(creep);
        } else if (creep.memory.role == 'transporter') {
            transporter(creep);
        }

        if(creep.memory.role == 'guard') {

        }
	}
}
