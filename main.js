var creepRoles = ['harvester','builder','attacker','miner',
    'transporter','repairer','stationaryUpgrader','transporterUpgrader',
    'scout','decoy','claimer'];

var creepFunctions = {};
for (let i of creepRoles) {
    creepFunctions[i] = require(i);
}

debug = false;

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
    } else if (data.role == 'decoy') {
        var numberParts = Math.floor(Game.spawns.Spawn1.room.energyCapacityAvailable / 100);
        for (let i = 0; i < Math.min(8,numberParts); i++) {
            parts = parts.concat([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE]);
        }
    } else if (data.role == 'attacker') {
        var numberParts = Math.floor(Game.spawns.Spawn1.room.energyCapacityAvailable / 210);
        for (let i = 0; i < Math.min(numberParts, 5); i++) {
            parts = parts.concat([ATTACK,ATTACK,MOVE]);
        }
    } else if (data.role == 'scout') {
        parts = [MOVE];
    } else if (data.role == 'claimer') {
        parts = [CLAIM,MOVE];
    } else {
        var numberParts = Math.floor(Game.spawns.Spawn1.room.energyCapacityAvailable / 200);
        parts = Array(numberParts).fill(WORK);
        parts = parts.concat(Array(numberParts).fill(CARRY));
        parts = parts.concat(Array(numberParts).fill(MOVE));
        data.gathering = true;
    }
    var name = Game.spawns.Spawn1.createCreep(parts, getName(name), data);
    if (name < 0 & debug) {
        console.log("Error spawning creep: " + name + parts);
    }
    if (typeof(name) == 'string') {
        logStr = '';
        logStr = logStr + "Spawning creep " + name;
        if (data.role == 'attacker') {
            logStr = logStr + " targeting room " + data.room;
        } else if (data.role == 'transporter') {
            logStr = logStr + " targeting pos " + JSON.stringify(data.sourcePos);
        }
        console.log(logStr);
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

var spawnCreeps = function() {
    var numberHarvesters = sumCreeps('harvester');
    var numberBuilders = sumCreeps ('builder');
    var numberMiners = sumCreeps('miner');
    var numberTransporters = sumCreeps('transporter');
    var numberRepairers = sumCreeps('repairer');
    var numberStationaryUpgraders = sumCreeps('stationaryUpgrader');
    var numberTransporterUpgraders = sumCreeps('transporterUpgrader');
    var numberScouts = sumCreeps('scout');
    var numberAttackers = sumCreeps('attacker');

    var scoutTarget = null;
    var searchRooms = [Game.spawns.Spawn1.room.name, 'E62N94', 'E61N93'];
    var minerTargetRoom = null;
    for (let r of searchRooms) {
        if (Game.rooms[r] == undefined
                && scoutTarget == null
                && _.filter(Game.creeps, c => c.memory.role == 'scout' && c.memory.targetPos.roomName == r).length == 0) {
            scoutTarget = r;
        } else if (minerTargetRoom == null) {
            let numberAssignedToRoom = _.filter(Game.creeps, c => c.memory.room == r && c.memory.role == 'miner' ).length;
            if (numberAssignedToRoom == 0
                    || (Game.rooms[r] && numberAssignedToRoom < Game.rooms[r].find(FIND_SOURCES).length)) {
                minerTargetRoom = r;
            }
        }
    }

    var transporterTargetPos = null;
    let transporterCapacity = Math.floor(Game.spawns.Spawn1.room.energyCapacityAvailable / 150) * 100;
    for (let r of searchRooms) {
        if (Game.rooms[r] != undefined) {
            for (let source of Game.rooms[r].find(FIND_SOURCES)) {
                let transporters = _.filter(Game.creeps, c => c.memory.targetPos == source.pos && c.memory.role == 'transporter');
                let path = PathFinder.search(Game.spawns.Spawn1.pos, {pos:source.pos, range: 1});
                let desiredTransporters = Math.ceil( 30 * path.cost / transporterCapacity) // 30 is ticks per move * max source mining rate
                if (transporters.length < desiredTransporters) {
                    transporterTargetPos = source.pos;
                    //console.log("WORK parts at " + source.id + " is " + total);
                    break;
                }
            }
        }
    }

    var claimerTargetRoom = null;
    for (let r of ['E62N94', 'E61N93']) {
        if (Game.rooms[r]) {
            if (_.filter(Game.creeps, c => c.memory.role == 'claimer' && c.memory.targetRoom == r).length == 0) {
                claimerTargetRoom = r;
                break;
            }
        }
    }

    searchRooms = [];
    searchRooms = _.filter(Game.flags, f => f.name == 'attack');
    for (let i in searchRooms) {
        searchRooms[i] = searchRooms[i].pos.roomName;
    }
    var spawnAttacker = false;
    var attackerTargetRoom = null;
    for (let r of searchRooms) {
        let trans = _.filter(Game.creeps, c => c.memory.targetRoom == r && c.memory.role == 'attacker').length;
        if (trans == 0) {
            spawnAttacker = true;
            attackerTargetRoom = r;
            break;
        }
    }

    if (numberHarvesters < 2 && (numberMiners == 0 || numberTransporters == 0)) {
        createCreep('Harvester ', {role:'harvester'});
    } else if (spawnAttacker) {
        createCreep('A', {role:'attacker',targetRoom:attackerTargetRoom});
    } else if (scoutTarget) {
        createCreep('S', {role:'scout', targetPos:{x:25,y:25,roomName:scoutTarget}})
    } else if (minerTargetRoom && numberMiners < numberTransporters) {
        createCreep('Miner ', {role:'miner',room:minerTargetRoom});
    } else if (transporterTargetPos) {
        createCreep('T', {role:'transporter', sourcePos:transporterTargetPos});
    } else if (numberBuilders < 2) {
        createCreep('B', {role:'builder'});
    } else if (numberRepairers < 1) {
        createCreep('R', {role:'repairer'});
    } else if (claimerTargetRoom) {
        createCreep('C', {role:'claimer', targetRoom: claimerTargetRoom});
    } else if (false) {
        createCreep('D', {role:'decoy', targetPos:{x:25,y:1,roomName:'E62N92'}});
    } else if (numberTransporterUpgraders < 2 && numberStationaryUpgraders >= numberTransporterUpgraders*2) {
        createCreep('TU', {role:'transporterUpgrader'});
    } else if (numberStationaryUpgraders < 4) {
        createCreep('SU', {role:'stationaryUpgrader'});
    }
}

module.exports.loop = function () {

    for(var i in Memory.creeps) {
        if(!Game.creeps[i]) {
            delete Memory.creeps[i];
        }
    }

    if (!Game.spawns.Spawn1.spawning) {
        spawnCreeps();
    }

	for(var name in Game.creeps) {
	    var creep = Game.creeps[name];

        if (creepFunctions[creep.memory.role] != undefined) {
            creepFunctions[creep.memory.role].run(creep);
        } else if (creep.memory.role == 'recycle') {
            creep.moveTo(Game.spawns.Spawn1);
        } else {
            console.log("Undefined function for role: " + creep.memory.role);
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
