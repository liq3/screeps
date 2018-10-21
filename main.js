// Any modules that you use that modify the game's prototypes should be require'd
// before you require the profiler.
const profiler = require('screeps-profiler');
const spawnManager = require('spawnManager');

// This line monkey patches the global prototypes.
profiler.enable();

let creepRoles = ['harvester','builder','combat','miner',
    'hauler','stationaryUpgrader','scout','decoy','claimer','spawnHelper','upgradeHauler'];

let creepFunctions = {};
for (let i of creepRoles) {
    creepFunctions[i] = require(i);
    profiler.registerObject(creepFunctions[i], i);
}

debug = false;

//Memory.ownedRooms = {'blah': []};

module.exports.loop = function () {
    profiler.wrap(function() {
    for(let i in Memory.creeps) {
        if(!Game.creeps[i]) {
            delete Memory.creeps[i];
        }
    }

    Memory.ownedRooms = {};
    for (let i in Game.spawns) {
        Memory.ownedRooms[Game.spawns[i].room.name] = [Game.spawns[i].room.name]
    }

    for (let i in Game.spawns) {
        try {
            if (!Game.spawns[i].spawning) {
                spawnManager.spawnCreeps(Game.spawns[i]);
            }
        } catch (err) {
            console.log(err.stack || err);
        }
    }

    for (let room in Game.rooms) {
        if (Game.rooms[room] && Game.rooms.controller && !Game.rooms[room].controller.my) {
            let danger = false;
            let hostileCreeps = Game.rooms[room].find(FIND_HOSTILE_CREEPS);
            for (let creep of hostileCreeps) {
                if (creep.getActiveBodyparts(ATTACK) > 0 || creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
                    danger = true;
                    break;
                }
            }
            if (danger && !Memory.dangerRooms.includes(room)) {
                Memory.dangerRooms.push(room);
            } else if (!danger && Memory.dangerRooms.includes(room)){
                Memory.dangerRooms.splice(Memory.dangerRooms.indexOf(room), 1);
            }
        }
    }

    let dangerFlags = _.filter(Game.flags, f => f.name.split(" ")[0] == 'danger');
    for (let i in dangerFlags) {
        let room = dangerFlags[i].pos.roomName;
        if (!Memory.dangerRooms.includes(room)) {
            Memory.dangerRooms.push(room);
        }
    }

	for(let name in Game.creeps) {
	    let creep = Game.creeps[name];

        try {
            if (creepFunctions[creep.memory.role] != undefined) {
                creepFunctions[creep.memory.role].run(creep);
            } else if (creep.memory.role == 'recycle') {
                creep.moveTo(creep.pos.findClosestByPath(FIND_MY_SPAWNS));
            } else {
                console.log("Undefined function for role: " + creep.memory.role);
            }
        } catch (err) {
            console.log(err.stack || err);
        }
	}

    let towers = _.filter(Game.structures, s => s.structureType == STRUCTURE_TOWER);
    for (let tower of towers) {
        let target = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {filter: c => c.pos.x != 0 && c.pos.y != 0 && c.pos.y != 49 && c.pos.x != 49});
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
        if (Memory.spawnTimes == undefined) {
            Memory.spawnTimes = [];
            if (!Memory.spawnTimes[spawn.id]) {
                Memory.spawnTimes[spawn.id] = [];
            }
        } else {
            if (!Memory.spawnTimes[spawn.id]) {
                Memory.spawnTimes[spawn.id] = [];
            }
        }
        if (Memory.spawnTimes[spawn.id].length > 100) {
            Memory.spawnTimes[spawn.id].shift();
        }
    }

    for (let i in Game.rooms) {
        let room = Game.rooms[i];
        if (room.controller && room.controller.my) {
            if (!room.controller.safeMode && !room.controller.safeModeCooldown && room.controller.safeModeAvalable > 0) {
                if (room.find(FIND_HOSTILE_CREEPS).length > 0) {
                    if (room.find(FIND_MY_STRUCTURES, {filter: s => s.structureType != STRUCTURE_RAMPART && s.structureType != STRUCTURE_EXTENSION && s.hits < s.hitsMax}).length > 0) {
                        room.controller.activateSafeMode();
                    }
                }
            }
        }
    }

    if (Game.cpu.bucket > 5000 && Game.market.credits < 1000) {
        let orders = Game.market.getAllOrders(order => order.resourceType == RESOURCE_ENERGY && order.type == ORDER_BUY && order.price >= 0.018);
        if (orders.length > 0) {
            console.log(JSON.stringify(orders));
            orders.sort((a,b) => b.price - a.price);
            for (let order of orders) {
                if (order.amount > 100) {
                    let sendAmount = order.amount;
                    if (Game.market.calcTransactionCost(order.amount, 'E61N94',order.roomName) + order.amount > Game.rooms['E61N94'].terminal.store[RESOURCE_ENERGY]) {
                        let sendCost = Game.market.calcTransactionCost(1000000,'E61N94',order.roomName) / 1000000;
                        sendAmount = order.amount * order.amount / (order.amount * (1+sendCost));
                    }
                    let err = Game.market.deal(order.id, sendAmount, 'E61N94');
                    console.log(`Deal: ${err}. ${sendAmount} for ${order.price} total ${order.amount*order.price}`);
                }
            }
        }
    }

    if (Memory.cpuTimes == undefined) {
        Memory.cpuTimes = [];
    }
    Memory.cpuTimes.push(Game.cpu.getUsed());
    if (Memory.cpuTimes.length > 1000) {
        Memory.cpuTimes.shift();
    }
    });
}

global.myUtils = {};

global.myUtils.avgCpu = function() {
    console.log(_.sum(Memory.cpuTimes) / Memory.cpuTimes.length);
}

global.myUtils.getSpawnTimes = function() {
    for (let i in Game.spawns) {
        let spawn = Game.spawns[i];
        let totalTimeSpawning = 0;
        for (let {tick, time} of Memory.spawnTimes[spawn.id]) {
            totalTimeSpawning += time;
        }
        console.log(`Spawn: ${spawn.id} Time: ${totalTime} / ${Game.time - Memory.spawnTimes[spawn.id][0].time}`);
    }
}

global.myUtils.toggleJobDisplay = function() {
    if (Memory.visuals == undefined) {
        Memory.visuals = {};
    }
    if (Memory.visuals.displayJobs != undefined) {
        Memory.visuals.displayJobs = !Memory.visuals.displayJobs;
    } else {
        Memory.visuals.displayJobs = false;
    }
}

global.myUtils.sourceInfo = function () {
    for (let r in Memory.ownedRooms) {
        let desiredEnergy = 0;
        for (let rr of Memory.ownedRooms[r]) {
            if (Game.rooms[rr]) {
                for (let source of Game.rooms[rr].find(FIND_SOURCES)) {
                    let path = PathFinder.search(Game.rooms[r].find(FIND_MY_SPAWNS)[0].pos, {pos:source.pos, range: 2}, {roomCallBack:global.costMatrixCallback, swamp:10, plains:2});
                    desiredEnergy += Math.ceil( 4 * path.cost * source.energyCapacity / ENERGY_REGEN_TIME);
                }
            }
        }
        console.log(`Desired energy total for ${Memory.ownedRooms[r]}: ${desiredEnergy}`);
    }
}

global.myUtils.partInfo = function () {
    for (let r in Memory.ownedRooms) {
        let parts = 0;
        let desiredCapacity = 0;
        let spawn = Game.rooms[r].find(FIND_MY_SPAWNS)[0];
        for (let rr of Memory.ownedRooms[r]) {
            if (Game.rooms[rr]) {
                for (let source of Game.rooms[rr].find(FIND_SOURCES)) {
                    let path = PathFinder.search(spawn.pos, {pos:source.pos, range: 2}, {roomCallBack:global.costMatrixCallback, swamp:10, plains:2});
                    desiredCapacity += Math.ceil(Math.ceil( 4 * path.cost * source.energyCapacity / ENERGY_REGEN_TIME)/100);
                    parts += 9;
                }
                if (rr != r) {
                    parts += 4;
                }
            }
        }
        let haulerCapacity = Math.floor((spawn.room.energyCapacityAvailable - 150) / 150);
        let desiredHaulerAmount = Math.ceil(desiredCapacity / haulerCapacity);
        parts += desiredHaulerAmount * (haulerCapacity * 3 + 2);
        console.log(`Room: ${r} Parts: ${parts}`);
    }
}

global.myUtils.energyPullInfo = function() {
    for (let id in Memory.energyPull) {
        let thing = Game.getObjectById(id);
        let mem = Memory.energyPull[id];
        console.log(thing +" "+ mem.desired + " " + mem.reserved)
    }
}

global.myUtils.createRoadBetweenFlags = function() {
    if (Game.flags.roadStart && Game.flags.roadEnd) {
        let start = Game.flags.roadStart.pos;
        let end = Game.flags.roadEnd.pos;
        let path = PathFinder.search(start, {pos:end, range:0}, {swampCost:2});
        for (let pos of path.path) {
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

global.CostMatrixCallback = profiler.registerFN(global.costMatrixCallback, 'global.costMatrixCallback');

global.myUtils.clearTransportMemory = function() {
    for (let i in Game.creeps) {
        let creep = Game.creeps[i];
        if (creep.memory.role == 'hauler') {
            delete creep.memory.reserved;
            delete creep.memory.targetId;
        }
    }
    delete Memory.energyPush;
    delete Memory.energyPull;
}

global.myUtils.countParts = function(rooms) {
    let ret = 0;
    for (let r of rooms) {
        for (let creep of Game.rooms[r].find(FIND_MY_CREEPS)) {
            ret += creep.body.length;
        }
    }
    console.log (ret + " parts.");
}
