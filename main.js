let creepRoles = ['harvester','builder','attacker','miner',
    'transporter','stationaryUpgrader','scout','decoy','claimer', 'spawnHelper'];

let creepFunctions = {};
for (let i of creepRoles) {
    creepFunctions[i] = require(i);
}

debug = false;

module.exports.loop = function () {

    for(let i in Memory.creeps) {
        if(!Game.creeps[i]) {
            if (Memory.creeps[i].role == 'transporter') {
                let creep = Memory.creeps[i];
                if (creep.gathering && Memory.energyPush[creep.targetId]) {
                    Memory.energyPush[creep.targetId].reserved -= creep.reserved;
                } else if (Memory.energyPull[creep.targetId]) {
                    Memory.energyPull[creep.targetId].reserved -= creep.reserved;
                }
            }
            delete Memory.creeps[i];
        }
    }

    for (let i in Game.spawns) {
        if (!Game.spawns[i].spawning) {
            spawnCreeps(Game.spawns[i]);
        }
    }

    if (Memory.energyPush == null) {
        Memory.energyPush = {};
    } else {
        for (let i in Memory.energyPush) {
            if(!Game.getObjectById(i)) {
                delete Memory.energyPush[i];
            }
        }
    }

    if (Memory.energyPull == null) {
        Memory.energyPull = {};
    } else {
        for (let i in Memory.energyPull) {
            if(!Game.getObjectById(i)) {
                delete Memory.energyPull[i];
            }
        }
    }

    for (let i in Game.rooms) {
        let room = Game.rooms[i];
        let droppedEnergies = room.find(FIND_DROPPED_RESOURCES, {filter: c => c.resourceType == RESOURCE_ENERGY});
        for (let res of droppedEnergies) {
            if (!(res.id in Memory.energyPush)) {
                Memory.energyPush[res.id] = {reserved:0};
            }
        }

        let pullStructures = room.find(FIND_MY_STRUCTURES, {filter:
            s => s.structureType == STRUCTURE_STORAGE || s.structureType == STRUCTURE_SPAWN ||
                s.structureType == STRUCTURE_TOWER || s.structureType == STRUCTURE_EXTENSION});
        pullStructures = pullStructures.concat(room.find(FIND_STRUCTURES, {filter: s => s.structureType == STRUCTURE_CONTAINER}));
        pullStructures = pullStructures.concat(_.filter(Game.creeps, c => c.memory.role == 'builder'));
        for (let structure of pullStructures) {
            if (!(structure.id in Memory.energyPull)) {
                Memory.energyPull[structure.id] = {id:structure.id, reserved:0};
            }
            let id = structure.id;
            if (structure instanceof StructureExtension) {
                Memory.energyPull[id].desired = structure.energyCapacity - structure.energy;
            } else if (structure instanceof StructureContainer) {
                Memory.energyPull[id].desired = structure.storeCapacity - structure.store[RESOURCE_ENERGY];
            } else if (structure instanceof StructureSpawn) {
                Memory.energyPull[id].desired = structure.energyCapacity - structure.energy;
            } else if (structure instanceof StructureStorage) {
                Memory.energyPull[id].desired = structure.storeCapacity - structure.store[RESOURCE_ENERGY];
            } else if (structure instanceof StructureTower) {
                Memory.energyPull[id].desired = structure.energyCapacity - structure.energy;
            } else if (structure instanceof Creep) {
                Memory.energyPull[id].desired = structure.carryCapacity - structure.carry.energy;
            }
        }
    }

	for(let name in Game.creeps) {
	    let creep = Game.creeps[name];

        try {
            if (creepFunctions[creep.memory.role] != undefined) {
                creepFunctions[creep.memory.role].run(creep);
            } else if (creep.memory.role == 'recycle') {
                creep.moveTo(Game.spawns.Spawn1);
            } else {
                console.log("Undefined function for role: " + creep.memory.role);
            }
        } catch (err) {
            console.log(err.stack || err);
        }
	}

    let towers = _.filter(Game.structures, s => s.structureType == STRUCTURE_TOWER);
    for (let tower of towers) {
        let target = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (target != null) {
            tower.attack(target);
        } else {
            target = tower.pos.findClosestByRange(FIND_MY_CREEPS, {filter: c => c.hits < c.hitsMax});
            if (target) {
                tower.heal(target);
            }
        }
    }

    for (let i in Game.spawns) {
        let spawn = Game.spawns[i];
        spawn.recycleCreep(spawn.pos.findClosestByRange( FIND_MY_CREEPS, {filter: c => c.memory.role == 'recycle'}));
    }

    if (Memory.cpuTimes == undefined) {
        Memory.cpuTimes = [];
    }
    Memory.cpuTimes.push(Game.cpu.getUsed());
    if (Memory.cpuTimes.length > 100) {
        Memory.cpuTimes.shift();
    }
}

global.myUtils = {};

global.myUtils.avgCpu = function() {
    console.log(_.sum(Memory.cpuTimes) / Memory.cpuTimes.length);
}

global.myUtils.sourceInfo = function () {
    let searchRooms = [Game.spawns.Spawn1.room.name, 'E62N94', 'E61N93', 'E62N93'];
    let transporterCapacity = Math.floor(Game.spawns.Spawn1.room.energyCapacityAvailable / 150) * 100;
    for (let r of searchRooms) {
        if (Game.rooms[r]) {
            for (let source of Game.rooms[r].find(FIND_SOURCES)) {
                let path = PathFinder.search(Game.spawns.Spawn1.pos, {pos:source.pos, range: 1}, {swampCost:10, plainCost:2, roomCallback:global.costMatrixCallback});
                let desiredTransporters = Math.ceil( (source.energyCapacity / ENERGY_REGEN_TIME) / (transporterCapacity / path.cost / 3));
                let miners = _.filter(Game.creeps, c => c.memory.sourceId == source.id && c.memory.role == 'miner');
                let transporters = _.filter(Game.creeps, c => c.memory.role == 'transporter'
                    && c.memory.sourcePos.x == source.pos.x
                    && c.memory.sourcePos.y == source.pos.y
                    && c.memory.sourcePos.roomName == source.pos.roomName );
                let names = "";
                for (let n in transporters) {
                    names = names + " " + n.name;
                }
                console.log(r+', '+source.pos.x+','+source.pos.y+' : '+ transporters.length +'/'+desiredTransporters+ ' Miners:' + miners.length +" Distance: " + path.cost + names);
            }
        }
    }
}

global.myUtils.energyPullInfo = function() {
    for (let id in Memory.energyPull) {
        let thing = Game.getObjectById(id);
        let mem = Memory.energyPull[id];
        console.log(thing +" "+ mem.desired + " " + mem.reserved)
    }
}

global.myUtils.createRoadsBetweenFlags = function() {
    if (Game.flags.roadStart && Game.flags.roadEnd) {
        let start = Game.flags.roadStart.pos;
        let end = Game.flags.roadEnd.pos;
        let path = PathFinder.search(start, {pos:end, range:0}, {swampCost:1});
        for (let pos of path) {
            Game.rooms[pos.roomName].createConstructionSite(pos.x,pos.y, STRUCTURE_ROAD);
        }
    } else {
        console.log("Flags not set properly!");
    }
}

global.costMatrixCallback = function(roomName) {
    var costMatrix = new PathFinder.CostMatrix;
    if (Game.rooms[roomName]) {
        for (let structure of Game.rooms[roomName].find(FIND_STRUCTURES)) {
            if (structure.structureType == STRUCTURE_ROAD) {
                if (costMatrix.get(structure.pos.x, structure.pos.y) == 0) {
                    costMatrix.set(structure.pos.x, structure.pos.y, 1);
                }
            } else if (!(structure.structureType == STRUCTURE_RAMPART || structure.structureType == STRUCTURE_CONTAINER)) {
                costMatrix.set(structure.pos.x, structure.pos.y, 255);
            }
        }
    }
    return costMatrix;
}

function createCreep(spawn, name, data) {
    let parts = [];
    if (data.role == 'miner') {
        let numberParts = Math.floor((spawn.room.energyCapacityAvailable - 150) / 100);
        parts = Array(Math.min(6,numberParts)).fill(WORK);
        parts = parts.concat([CARRY,MOVE,MOVE]);
    } else if (data.role == 'stationaryUpgrader') {
        let numberParts = Math.floor((spawn.room.energyCapacityAvailable - 100) / 100);
        parts = Array(numberParts).fill(WORK);
        parts = parts.concat([CARRY,MOVE]);
    } else if (data.role == 'transporter' || data.role == 'spawnHelper') {
        let numberParts = Math.floor(spawn.room.energyCapacityAvailable / 150);
        parts = Array(numberParts).fill(CARRY);
        parts = parts.concat(Array(numberParts).fill(CARRY));
        parts = parts.concat(Array(numberParts).fill(MOVE));
        data.gathering = true;
    } else if (data.role == 'harvester') {
        parts = [WORK,CARRY,CARRY,CARRY,MOVE];
        data.gathering = true;
    } else if (data.role == 'decoy') {
        let numberParts = Math.floor(spawn.room.energyCapacityAvailable / 100);
        for (let i = 0; i < Math.min(8,numberParts); i++) {
            parts = parts.concat([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE]);
        }
    } else if (data.role == 'attacker') {
        let numberParts = Math.floor(spawn.room.energyCapacityAvailable / 210);
        for (let i = 0; i < Math.min(numberParts, 5); i++) {
            parts = parts.concat([ATTACK,ATTACK,MOVE]);
        }
    } else if (data.role == 'scout') {
        parts = [MOVE];
    } else if (data.role == 'claimer') {
        parts = [CLAIM,MOVE];
    } else {
        if (spawn.room.energyCapacityAvailable < 350) {
            parts = [WORK, CARRY, CARRY, MOVE, MOVE];
        } else {
            let numberParts = Math.floor(spawn.room.energyCapacityAvailable / 350);
            parts = Array(numberParts).fill(WORK);
            parts = parts.concat(Array(numberParts*2).fill(CARRY));
            parts = parts.concat(Array(numberParts*3).fill(MOVE));
            data.gathering = true;
        }
    }
    name = spawn.createCreep(parts, getName(name), data);
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

function getName(name, num) {
    if (num == undefined) {
        num = 0;
    }
    if (!((name + num) in Game.creeps)) {
        return name + num;
    } else {
        return getName(name, num+1);
    }
}

function spawnCreeps(spawn) {
    function sumCreeps(role, room) {
        if (room == undefined) {
            return _.sum(Game.creeps, c => c.memory.role == role);
        } else {
            return room.find(FIND_MY_CREEPS, {filter: c=> c.memory.role == role}).length;
        }
    }

    let numberHarvesters = sumCreeps('harvester', spawn.room);
    let numberBuilders = sumCreeps ('builder');
    let numberMiners = sumCreeps('miner');
    let numberTransporters = sumCreeps('transporter');
    let numberStationaryUpgraders = sumCreeps('stationaryUpgrader', spawn.room);
    let numberScouts = sumCreeps('scout');
    let numberAttackers = sumCreeps('attacker');
    let numberSpawnHelpers = sumCreeps('spawnHelper', spawn.room);

    let scoutTarget = null;
    let searchRooms = [Game.spawns.Spawn1.room.name, 'E62N94'];//, 'E61N93', 'E62N93'];
    let minerTargetId = null;
    let spawnTransporter = false;
    let transporterCapacity = Math.floor(Game.spawns.Spawn1.room.energyCapacityAvailable / 150) * 100;
    let sourceList = [];
    for (let r of searchRooms) {
        if (Game.rooms[r] == null && scoutTarget == null
                && _.filter(Game.creeps, c => c.memory.role == 'scout' && c.memory.targetPos.roomName == r).length == 0) {
            scoutTarget = r;
        } else if (Game.rooms[r]) {
            for (let source of Game.rooms[r].find(FIND_SOURCES)) {
                let path = PathFinder.search(Game.spawns.Spawn1.pos, {pos:source.pos, range: 1}, {swampCost:10, plainCost:2, roomCallback:global.costMatrixCallback});
                sourceList.push({source:source, path:path});
            }
        }
    }

    sourceList.sort((a,b) => a.path.cost - b.path.cost );
    let desiredTransportCapacity = 0;
    for (let {source,path} of sourceList) {
        let miners = _.filter(Game.creeps, c => c.memory.sourceId == source.id && c.memory.role == 'miner');
        if (minerTargetId == null && (miners.length == 0 || (miners.length == 1 && miners[0].ticksToLive < ((path.cost+9)*3)))) {
            minerTargetId = source.id;
            break;
        }

        desiredTransportCapacity += Math.ceil( 2 * path.cost * source.energyCapacity / ENERGY_REGEN_TIME);
    }
    let transportCapacity = 0;
    for (let creep of _.filter(Game.creeps, c => c.memory.role == 'transporter')) {
        for (let part of creep.body) {
            if (part.type == CARRY) {
                transportCapacity += 50;
            }
        }
    }
    if (transportCapacity < desiredTransportCapacity) {
        spawnTransporter = true;
    }

    let claimerTargetRoom = null;
    for (let r of ['E62N94', 'E61N93']) {
        if (Game.rooms[r]) {
            if (_.filter(Game.creeps, c => c.memory.role == 'claimer' && c.memory.targetRoom == r).length < 2) {
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
    let spawnAttacker = false;
    let attackerTargetRoom = null;
    for (let r of searchRooms) {
        let trans = _.filter(Game.creeps, c => c.memory.targetRoom == r && c.memory.role == 'attacker').length;
        if (trans == 0) {
            spawnAttacker = true;
            attackerTargetRoom = r;
            break;
        }
    }

    if (numberHarvesters < 2 && (sumCreeps('miner', spawn.room) == 0 || numberTransporters == 0)) {
        createCreep(spawn, 'Harvester ', {role:'harvester'});
    } else if (spawnAttacker) {
        createCreep(spawn, 'A', {role:'attacker',targetRoom:attackerTargetRoom});
    } else if (scoutTarget) {
        createCreep(spawn, 'S', {role:'scout', targetPos:{x:25,y:25,roomName:scoutTarget}})
    } else if (numberBuilders < 2 && numberTransporters >= numberBuilders * 2 + 1) {
        createCreep(spawn, 'B', {role:'builder'});
    } else if (numberSpawnHelpers < 1 && spawn.room.storage && spawn.room.storage.store[RESOURCE_ENERGY] > 5000) {
        createCreep(spawn, 'SH', {role:'spawnHelper'});
    } else if (minerTargetId && numberMiners < numberTransporters) {
        createCreep(spawn, 'Miner ', {role:'miner',sourceId:minerTargetId});
    } else if (spawnTransporter) {
        createCreep(spawn, 'T', {role:'transporter'});
    } else if (claimerTargetRoom) {
        createCreep(spawn, 'C', {role:'claimer', targetRoom: claimerTargetRoom});
    } else if (false) {
        createCreep(spawn, 'D', {role:'decoy', targetPos:{x:25,y:1,roomName:'E62N92'}});
    } else if (numberStationaryUpgraders < 5 && numberStationaryUpgraders < Math.ceil(spawn.room.storage.store[RESOURCE_ENERGY] / 20000)) {
        createCreep(spawn, 'SU', {role:'stationaryUpgrader'});
    }
}
