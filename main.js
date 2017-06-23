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
var createCreep = function(name, roleStr) {
    var parts = [];
    if (roleStr == 'miner') {
        var numberParts = Math.floor((Game.spawns.Spawn1.room.energyCapacityAvailable - 100) / 100);
        parts = Array(numberParts).fill(WORK);
        parts = parts.concat([CARRY,MOVE]);
    } else if (roleStr == 'transporter') {
        var numberParts = Math.floor(Game.spawns.Spawn1.room.energyCapacityAvailable / 100);
        parts = Array(numberParts).fill(CARRY);
        parts = parts.concat(Array(numberParts).fill(MOVE));
    } else if (roleStr == 'harvester') {
        parts = [WORK,CARRY,CARRY,CARRY,MOVE];
    } else {
        var numberParts = Math.floor(Game.spawns.Spawn1.room.energyCapacityAvailable / 200);
        parts = Array(numberParts).fill(WORK);
        parts = parts.concat(Array(numberParts).fill(CARRY));
        parts = parts.concat(Array(numberParts).fill(MOVE));
    }
    var name = Game.spawns.Spawn1.createCreep(parts, getName(name), {role: roleStr, gathering:true});
    if (typeof(name) == 'string') {
        console.log("Spawned creep " + name);
    }
    return name;
}

var getName = function(name, num) {
    if (num == undefined) {
        num = 0;
    }
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

    var spawnMiners = false;
    var sources = Game.spawns.Spawn1.room.find(FIND_SOURCES)
    var minerTagetId = null;
    for (let source of sources) {
        let miners = source.pos.findInRange(FIND_MY_CREEPS, 2, {filter:
            c => c.memory.role == 'miner'});
        miners = miners.concat(Game.spawns.Spawn1.room.find(FIND_MY_CREEPS, {
            filter: c => c.memory.sourceId == source.id }));
        let total = 0;
        for (let minerC of miners) {
            for (let part in minerC.body) {
                if (part.type == WORK) {
                    total = total + 1;
                }
            }
        }
        if (total < 6) {
            spawnMiners = true;
            minerTargetId = source.id;
            break;
        }
        //console.log("WORK parts at " + sources[source_i].id + " is " + total);
    }

    var source = Game.spawns.Spawn1.room.find(FIND_SOURCES)[0];
    if (numberHarvesters < 2 && (numberMiners == 0 || numberTransporters == 0)) {
        createCreep('Harvester ', 'harvester');
    } else if (spawnMiners) {
        let name = createCreep('Miner ', 'miner');
        if (typeof(name) == 'string') {
            Game.creeps[name].memory.sourceId = minerTargetId;
        }
    } else if (numberTransporters < 2) {
        createCreep('Transporter ', 'transporter');
    } else if (numberBuilders < 2) {
        createCreep('Builder ', 'builder');
    } else if (numberRepairers < 1) {
        createCreep('Repairer ', 'repairer');
    } else if (numberUpgraders < 3){
        createCreep('Upgrader ', 'upgrader');
    } else {
        let droppedEnergy = Game.spawns.Spawn1.room.find(FIND_DROPPED_RESOURCES,
            {filter: r => r.resourceType == RESOURCE_ENERGY});
        let total = 0;
        for (let r of droppedEnergy) {
            total = total + r.amount;
        }
        if (total > 500) {
            createCreep('Upgrader ', 'upgrader');
        }
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
        } else if (creep.memory.role == 'recycle') {
            creep.moveTo(Game.spawns.Spawn1);
        }

        if(creep.memory.role == 'guard') {

        }
	}
}
