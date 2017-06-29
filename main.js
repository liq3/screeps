let creepRoles = ['harvester','builder','attacker','miner',
    'transporter','repairer','stationaryUpgrader','transporterUpgrader',
    'scout','decoy','claimer', 'spawnHelper'];

let creepFunctions = {};
for (let i of creepRoles) {
    creepFunctions[i] = require(i);
}

debug = false;

module.exports.loop = function () {

    for(let i in Memory.creeps) {
        if(!Game.creeps[i]) {
            delete Memory.creeps[i];
        }
    }

    if (!Game.spawns.Spawn1.spawning) {
        spawnCreeps();
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

    for (let i in Game.rooms) {
        let room = Game.rooms[i];
        let droppedEnergy = room.find(FIND_DROPPED_RESOURCES, {filter: c => c.resourceType == RESOURCE_ENERGY});
        for (let res of droppedEnergy) {
            if (!(res.id in Memory.energyPush)) {
                Memory.energyPush[res.id] = {reserved:0};
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

    let towers = Game.spawns.Spawn1.room.find(FIND_MY_STRUCTURES, {filter:
        s => s.structureType == STRUCTURE_TOWER});
    for (let tower of towers) {
        let target = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (target != null) {
            tower.attack(target);
        }
    }

    Game.spawns.Spawn1.recycleCreep(Game.spawns.Spawn1.pos.findClosestByRange(
        FIND_MY_CREEPS, {filter: c => c.memory.role == 'recycle'}));

    if (Memory.cpuTimes == undefined) {
        Memory.cpuTimes = [];
    }
    Memory.cpuTimes.push(Game.cpu.getUsed());
    if (Memory.cpuTimes.length > 100) {
        Memory.cpuTimes.shift();
    }
}

global.myUtil = {};

global.myUtil.avgCpu = function() {
    console.log(_.sum(Memory.cpuTimes) / Memory.cpuTimes.length);
}

global.myUtil.sourceInfo = function () {
    let searchRooms = [Game.spawns.Spawn1.room.name, 'E62N94', 'E61N93', 'E62N93'];
    let transporterCapacity = Math.floor(Game.spawns.Spawn1.room.energyCapacityAvailable / 150) * 100;
    for (let r of searchRooms) {
        if (Game.rooms[r]) {
            for (let source of Game.rooms[r].find(FIND_SOURCES)) {
                let path = PathFinder.search(Game.spawns.Spawn1.pos, {pos:source.pos, range: 1});
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

global.myUtil.createRoadsBetweenFlags = function() {
    if (Game.flags.roadStart && Game.flags.roadEnd) {
        let start = Game.flags.roadStart.pos;
        let end = Game.flags.roadEnd.pos;
        let path = start.findPathTo(end, {ignoreCreeps: true});
        let room = Game.rooms[start.roomName];
        for (let pos of path) {
            room.createConstructionSite(pos.x,pos.y, STRUCTURE_ROAD);
        }
    } else {
        console.log("Flags not set properly!");
    }
}

function sumCreeps(role) {
    return _.sum(Game.creeps, c => c.memory.role == role);
}

function createCreep(name, data) {
    let parts = [];
    if (data.role == 'miner') {
        let numberParts = Math.floor((Game.spawns.Spawn1.room.energyCapacityAvailable - 150) / 100);
        parts = Array(Math.min(6,numberParts)).fill(WORK);
        parts = parts.concat([CARRY,MOVE,MOVE]);
    } else if (data.role == 'stationaryUpgrader') {
        let numberParts = Math.floor((Game.spawns.Spawn1.room.energyCapacityAvailable - 50) / 150);
        parts = Array(numberParts).fill(WORK);
        parts = parts.concat(Array(numberParts).fill(CARRY));
        parts = parts.concat([MOVE]);
    } else if (data.role == 'transporter' || data.role == 'transporterUpgrader' || data.role == 'spawnHelper') {
        let numberParts = Math.floor(Game.spawns.Spawn1.room.energyCapacityAvailable / 150);
        parts = Array(numberParts).fill(CARRY);
        parts = parts.concat(Array(numberParts).fill(CARRY));
        parts = parts.concat(Array(numberParts).fill(MOVE));
        data.gathering = true;
    } else if (data.role == 'harvester') {
        parts = [WORK,CARRY,CARRY,CARRY,MOVE];
        data.gathering = true;
    } else if (data.role == 'decoy') {
        let numberParts = Math.floor(Game.spawns.Spawn1.room.energyCapacityAvailable / 100);
        for (let i = 0; i < Math.min(8,numberParts); i++) {
            parts = parts.concat([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE]);
        }
    } else if (data.role == 'attacker') {
        let numberParts = Math.floor(Game.spawns.Spawn1.room.energyCapacityAvailable / 210);
        for (let i = 0; i < Math.min(numberParts, 5); i++) {
            parts = parts.concat([ATTACK,ATTACK,MOVE]);
        }
    } else if (data.role == 'scout') {
        parts = [MOVE];
    } else if (data.role == 'claimer') {
        parts = [CLAIM,MOVE];
    } else {
        let numberParts = Math.floor(Game.spawns.Spawn1.room.energyCapacityAvailable / 200);
        parts = Array(numberParts).fill(WORK);
        parts = parts.concat(Array(numberParts).fill(CARRY));
        parts = parts.concat(Array(numberParts).fill(MOVE));
        data.gathering = true;
    }
    name = Game.spawns.Spawn1.createCreep(parts, getName(name), data);
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

function spawnCreeps() {
    let numberHarvesters = sumCreeps('harvester');
    let numberBuilders = sumCreeps ('builder');
    let numberMiners = sumCreeps('miner');
    let numberTransporters = sumCreeps('transporter');
    let numberRepairers = sumCreeps('repairer');
    let numberStationaryUpgraders = sumCreeps('stationaryUpgrader');
    let numberTransporterUpgraders = sumCreeps('transporterUpgrader');
    let numberScouts = sumCreeps('scout');
    let numberAttackers = sumCreeps('attacker');
    let numberSpawnHelpers = sumCreeps('spawnHelper');

    let scoutTarget = null;
    let searchRooms = [Game.spawns.Spawn1.room.name, 'E62N94'];//, 'E61N93', 'E62N93'];
    let minerTargetId = null;
    let transporterSourceId = null;
    let transporterCapacity = Math.floor(Game.spawns.Spawn1.room.energyCapacityAvailable / 150) * 100;
    let sourceList = [];
    for (let r of searchRooms) {
        if (Game.rooms[r] == null && scoutTarget == null
                && _.filter(Game.creeps, c => c.memory.role == 'scout' && c.memory.targetPos.roomName == r).length == 0) {
            scoutTarget = r;
        } else if (Game.rooms[r]) {
            for (let source of Game.rooms[r].find(FIND_SOURCES)) {
                let path = PathFinder.search(Game.spawns.Spawn1.pos, {pos:source.pos, range: 1});
                sourceList.push({source:source, path:path});
            }
        }
    }

    sourceList.sort((a,b) => a.path.cost - b.path.cost );

    for (let {source,path} of sourceList) {
        let miners = _.filter(Game.creeps, c => c.memory.sourceId == source.id && c.memory.role == 'miner');
        if (miners.length == 0 || (miners.length == 1 && miners[0].ticksToLive < ((path.cost+9)*3))) {
            minerTargetId = source.id;
            break;
        }
        let transporters = _.filter(Game.creeps, c => c.memory.role == 'transporter'
            && c.memory.sourcePos.x == source.pos.x
            && c.memory.sourcePos.y == source.pos.y
            && c.memory.sourcePos.roomName == source.pos.roomName );
        let desiredTransporters = Math.ceil( (source.energyCapacity / ENERGY_REGEN_TIME) / (transporterCapacity / path.cost / 3));
        if (transporters.length < desiredTransporters) {
            transporterSourceId = source.id;
            break;
        }
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

    if (numberHarvesters < 2 && (numberMiners == 0 || numberTransporters == 0)) {
        createCreep('Harvester ', {role:'harvester'});
    } else if (spawnAttacker) {
        createCreep('A', {role:'attacker',targetRoom:attackerTargetRoom});
    } else if (scoutTarget) {
        createCreep('S', {role:'scout', targetPos:{x:25,y:25,roomName:scoutTarget}})
    } else if (numberBuilders < 2 && numberTransporters >= numberBuilders * 2 + 1) {
        createCreep('B', {role:'builder'});
    } else if (numberRepairers < 1 && numberTransporters >= 5) {
        createCreep('R', {role:'repairer'});
    } else if (numberSpawnHelpers < 1 && Game.spawns.Spawn1.room.storage && Game.spawns.Spawn1.room.storage.store[RESOURCE_ENERGY] > 5000) {
        createCreep('SH', {role:'spawnHelper'});
    } else if (minerTargetId && numberMiners < numberTransporters) {
        createCreep('Miner ', {role:'miner',sourceId:minerTargetId});
    } else if (transporterSourceId) {
        createCreep('T', {role:'transporter', sourcePos:Game.getObjectById(transporterSourceId).pos, sourceId: transporterSourceId});
    } else if (claimerTargetRoom) {
        createCreep('C', {role:'claimer', targetRoom: claimerTargetRoom});
    } else if (false) {
        createCreep('D', {role:'decoy', targetPos:{x:25,y:1,roomName:'E62N92'}});
    } else if (numberTransporterUpgraders < 1 && numberStationaryUpgraders >= numberTransporterUpgraders*2) {
        createCreep('TU', {role:'transporterUpgrader'});
    } else if (numberStationaryUpgraders < 2) {
        createCreep('SU', {role:'stationaryUpgrader'});
    }
}
