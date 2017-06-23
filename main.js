var harvester = require('harvester');
var upgrader = require('upgrader');
var builder = require('builder');
var guard = require('guard');
var miner = require('miner');
var transporter = require('transporter');
var repairer = require('repairer');

var sumCreeps = function(role) {
    return _.sum(Game.creeps, c => c.memory.role == role);
}
var createCreep = function(parts, name, roleStr) {
    if (roleStr == 'miner') {
        var numberParts = Math.floor((Game.spawns.Spawn1.room.energyCapacityAvailable - 100) / 100);
        parts = Array(numberParts).fill(WORK);
        parts = parts.concat([CARRY,MOVE]);
    } else if (roleStr == 'transporter') {
        var numberParts = Math.floor(Game.spawns.Spawn1.room.energyCapacityAvailable / 100);
        parts = Array(numberParts).fill(CARRY);
        parts.concat(Array(numberParts).fill(MOVE));
    } else if (roleStr != 'harvester') {
        var numberParts = Math.floor(Game.spawns.Spawn1.room.energyCapacityAvailable / 200);
        parts = Array(numberParts).fill(WORK);
        parts.concat(Array(numberParts).fill(CARRY));
        parts.concat(Array(numberParts).fill(MOVE));
    }
    var name = Game.spawns.Spawn1.createCreep(parts, name, {role: roleStr, gathering:true});
    if (typeof(name) == 'string') {
        console.log("Spawned creep " + name);
    }
    return name;
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
    var numberRepairers = sumCreeps('repairer');

    var source = Game.spawns.Spawn1.room.find(FIND_SOURCES)[0];
    if (numberHarvesters < 1 && (numberMiners == 0 || numberTransporters == 0)) {
        createCreep([WORK,WORK,CARRY,MOVE], getName('Harvester ', 0), 'harvester');
    } else if (numberMiners < 3) {
        createCreep([WORK,WORK,CARRY,MOVE], getName('Miner ', 0), 'miner');
    } else if (numberTransporters < 2) {
        createCreep([CARRY,CARRY,CARRY,MOVE,MOVE,MOVE], getName('Transporter ', 0), 'transporter');
    } else if (numberBuilders < 2) {
        createCreep([WORK,WORK,CARRY,MOVE], getName('Builder ', 0), 'builder');
    } else if (numberRepairers < 1) {
        createCreep([WORK,CARRY,CARRY,MOVE,MOVE], getName('Repairer ', 0), 'repairer');
    } else if (numberUpgraders < 3){
        createCreep([WORK,WORK,CARRY,MOVE], getName('Upgrader ', 0), 'upgrader');
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
        } else if (creep.memory.role == 'repairer') {
            repairer(creep);
        }

        if(creep.memory.role == 'guard') {

        }
	}
}
