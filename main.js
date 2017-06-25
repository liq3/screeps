var harvester = require('harvester');
var upgrader = require('upgrader');
var builder = require('builder');
var attacker = require('attacker');
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
var createCreep = function(name, data) {
    var parts = [];
    if (data.role == 'miner') {
        var numberParts = Math.floor((Game.spawns.Spawn1.room.energyCapacityAvailable - 150) / 100);
        parts = Array(Math.min(6,numberParts)).fill(WORK);
        parts = parts.concat([CARRY,MOVE,MOVE]);
    } else if (data.role == 'stationaryUpgrader') {
        var numberParts = Math.floor((Game.spawns.Spawn1.room.energyCapacityAvailable - 50) / 150);
        parts = Array(numberParts).fill(WORK);
        parts = parts.concat(Array(numberParts).fill(CARRY));
        parts = parts.concat([MOVE]);
    } else if (data.role == 'transporter' || data.role == 'transporterUpgrader') {
        var numberParts = Math.floor(Game.spawns.Spawn1.room.energyCapacityAvailable / 150);
        parts = Array(numberParts).fill(CARRY);
        parts = parts.concat(Array(numberParts).fill(CARRY));
        parts = parts.concat(Array(numberParts).fill(MOVE));
        data.gathering = true;
    } else if (data.role == 'harvester') {
        parts = [WORK,CARRY,CARRY,CARRY,MOVE];
        data.gathering = true;
    } else if (data.role == 'traveler') {
        parts = Array(35).fill(TOUGH).concat([MOVE]);
    } else if (data.role == 'attacker') {
        var numberParts = Math.floor(Game.spawns.Spawn1.room.energyCapacityAvailable / 210);
        for (let i = 0; i < numberParts; i++) {
            parts = parts.concat([ATTACK,ATTACK,MOVE]);
        }
    } else {
        var numberParts = Math.floor(Game.spawns.Spawn1.room.energyCapacityAvailable / 200);
        parts = Array(numberParts).fill(WORK);
        parts = parts.concat(Array(numberParts).fill(CARRY));
        parts = parts.concat(Array(numberParts).fill(MOVE));
        data.gathering = true;
    }
    var name = Game.spawns.Spawn1.createCreep(parts, getName(name), data);
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
    var numberTravelers = sumCreeps('traveler');
    var numberAttackers = sumCreeps('attacker');

    var spawnMiners = false;
    var searchRooms = [Game.spawns.Spawn1.room.name, 'E62N94', 'E61N93'];
    var sources = [2,2,1];
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

    var spawnTransporters = false;
    var transporterTargetRoom = null;
    for (let r of searchRooms) {
        let trans = Game.rooms[r].find(FIND_MY_CREEPS, {
            filter: c => c.memory.room == r && c.memory.role == 'transporter' });
        let tempRoom = Game.rooms[r];
        if (tempRoom != null && trans.length < tempRoom.find(FIND_SOURCES).length) {
            spawnTransporters = true;
            transporterTargetRoom = r;
            //console.log("WORK parts at " + source.id + " is " + total);
            break;
        }
    }

    if (numberHarvesters < 2 && (numberMiners == 0 || numberTransporters == 0)) {
        createCreep('Harvester ', {role:'harvester'});
    } else if (spawnMiners) {
        createCreep('Miner ', {role:'miner',sourceId:minerTargetId});
    } else if (spawnTransporters) {
        createCreep('T', {role:'transporter', room:transporterTargetRoom});
    } else if (numberTravelers < 0) {
        createCreep('Trav', {role:'traveler', target:{x:1,y:28,roomName:'E62N94'}});
    } else if (numberBuilders < 2) {
        createCreep('B', {role:'builder'});
    } else if (numberRepairers < 1) {
        createCreep('R', {role:'repairer'});
    } else if (numberUpgraders < 0) {
        createCreep('U', {role:'upgrader'});
    } else if (numberAttackers < 1) {
        createCreep('A', {role:'attacker',targetRoom:'E62N94'});
    } else if (numberTransporterUpgraders < 4 && numberStationaryUpgraders >= numberTransporterUpgraders) {
        createCreep('TU', {role:'transporterUpgrader'});
    } else if (numberStationaryUpgraders < 4) {
        createCreep('SU', {role:'stationaryUpgrader'});
    } else if (false) {
        let droppedEnergy = Game.spawns.Spawn1.room.find(FIND_DROPPED_RESOURCES,
            {filter: r => r.resourceType == RESOURCE_ENERGY});
        let total = 0;
        for (let r of droppedEnergy) {
            total = total + r.amount;
        }
        if (total > 500) {
            createCreep('Upgrader ', {role:'upgrader'});
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
        } else if (creep.memory.role == 'attacker') {
            attacker(creep);
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
