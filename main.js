var harvester = require('harvester');
var upgrader = require('upgrader');
var builder = require('builder');
var guard = require('guard');
var miner = require('miner');
var transporter = require('transporter');
var repairer = require('repairer');
var stationaryUpgrader = require('stationaryUpgrader');
var transporterUpgrader = require('transporterUpgrader');
var traveler = require('traveler');

var createRoadsOnPath = function(start, end) {
    var path = start.findPathTo(end, {ignoreCreeps: true});
    var room = Game.rooms[start.roomName];
    for (let pos of path) {
        room.createConstructionSite(pos.x,pos.y, STRUCTURE_ROAD);
    }
}

var sumCreeps = function(role) {
    return _.sum(Game.creeps, c => c.memory.role == role);
}
var createCreep = function(name, roleStr) {
    var parts = [];
    if (roleStr == 'miner') {
        var numberParts = Math.floor((Game.spawns.Spawn1.room.energyCapacityAvailable - 150) / 100);
        parts = Array(Math.min(6,numberParts)).fill(WORK);
        parts = parts.concat([CARRY,MOVE,MOVE]);
    } else if (roleStr == 'stationaryUpgrader') {
        var numberParts = Math.floor((Game.spawns.Spawn1.room.energyCapacityAvailable - 50) / 150);
        parts = Array(numberParts).fill(WORK);
        parts = parts.concat(Array(numberParts).fill(CARRY));
        parts = parts.concat([MOVE]);
    } else if (roleStr == 'transporter' || roleStr == 'transporterUpgrader') {
        var numberParts = Math.floor(Game.spawns.Spawn1.room.energyCapacityAvailable / 150);
        parts = Array(numberParts).fill(CARRY);
        parts = parts.concat(Array(numberParts).fill(CARRY));
        parts = parts.concat(Array(numberParts).fill(MOVE));
    } else if (roleStr == 'harvester') {
        parts = [WORK,CARRY,CARRY,CARRY,MOVE];
    } else if (roleStr == 'traveler') {
        parts = [TOUGH,MOVE];
    } else {
        var numberParts = Math.floor(Game.spawns.Spawn1.room.energyCapacityAvailable / 200);
        parts = Array(numberParts).fill(WORK);
        parts = parts.concat(Array(numberParts).fill(CARRY));
        parts = parts.concat(Array(numberParts).fill(MOVE));
    }
    var name = Game.spawns.Spawn1.createCreep(parts, getName(name), {role: roleStr, gathering:true});
    if (name < 0) {
        //console.log("Error spawning creep: " + name + parts);
    }
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
    var numberStationaryUpgraders = sumCreeps('stationaryUpgrader');
    var numberTransporterUpgraders = sumCreeps('transporterUpgrader');

    var spawnMiners = false;
    var sources = Game.spawns.Spawn1.room.find(FIND_SOURCES);
    var minerTargetId = null;
    for (let source of sources) {
        let miners = Game.spawns.Spawn1.room.find(FIND_MY_CREEPS, {
            filter: c => c.memory.sourceId == source.id });
        let total = 0;
        for (let minerC of miners) {
            for (let part of minerC.body) {
                if (part.type == WORK) {
                    total = total + 1;
                }
            }
        }
        if (total < 6) {
            spawnMiners = true;
            minerTargetId = source.id;
            //console.log("WORK parts at " + source.id + " is " + total);
            break;
        }
    }


    if (numberHarvesters < 2 && (numberMiners == 0 || numberTransporters == 0)) {
        createCreep('Harvester ', 'harvester');
    } else if (spawnMiners) {
        let name = createCreep('Miner ', 'miner');
        if (typeof(name) == 'string') {
            Game.creeps[name].memory.sourceId = minerTargetId;
        }
    } else if (numberTransporters < 2) {
        createCreep('T', 'transporter');
    } else if (numberBuilders < 2) {
        createCreep('B', 'builder');
    } else if (numberRepairers < 1) {
        createCreep('R', 'repairer');
    } else if (numberUpgraders < 0){
        createCreep('U', 'upgrader');
    } else if (numberTransporterUpgraders < 4 && numberStationaryUpgraders >= numberTransporterUpgraders) {
        createCreep('TU', 'transporterUpgrader');
    } else if (numberStationaryUpgraders < 4) {
        createCreep('SU', 'stationaryUpgrader');
    } else if (false) {
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
        } else if (creep.memory.role == 'stationaryUpgrader') {
            stationaryUpgrader(creep);
        } else if (creep.memory.role == 'transporterUpgrader') {
            transporterUpgrader(creep);
        } else if (creep.memory.role == 'traveler') {
            traveler(creep);
        }
	}

    var towers = Game.spawns.Spawn1.room.find(FIND_MY_STRUCTURES, {filter:
        s => s.structureType == STRUCTURE_TOWER});
    for (let tower of towers) {
        let target = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (target != null) {
            tower.attack(target);
        }
    }

    Game.spawns.Spawn1.recycleCreep(Game.spawns.Spawn1.pos.findClosestByRange(
        FIND_CREEPS, {filter: c => c.memory.role == 'recycle'}));
}
