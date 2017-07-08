// Any modules that you use that modify the game's prototypes should be require'd
// before you require the profiler.
const profiler = require('screeps-profiler');
const spawnManager = require('spawnManager');

// This line monkey patches the global prototypes.
profiler.enable();

let creepRoles = ['harvester','builder','attacker','miner','guard',
    'hauler','stationaryUpgrader','scout','decoy','claimer', 'spawnHelper','upgradeHauler'];

let creepFunctions = {};
for (let i of creepRoles) {
    creepFunctions[i] = require(i);
    profiler.registerObject(creepFunctions[i], i);
}

debug = false;

if (Memory.ownedRooms == undefined) {
    Memory.ownedRooms = {'E61N94': ['E61N94', 'E62N94','E61N93'], 'E62N93': ['E62N93','E63N93']};
}

module.exports.loop = function () {
    profiler.wrap(function() {
    for(let i in Memory.creeps) {
        if(!Game.creeps[i]) {
            delete Memory.creeps[i];
        }
    }

    for (let i in Game.spawns) {
        if (!Game.spawns[i].spawning) {
            spawnManager.spawnCreeps(Game.spawns[i]);
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
    }

    if (Game.market.credits < 1000) {
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

global.myUtils.sourceInfo = function () {
    for (let r in Memory.ownedRooms) {
        for (let rr of Memory.ownedRooms[r]) {
            if (Game.rooms[rr]) {
                for (let source of Game.rooms[rr].find(FIND_SOURCES)) {
                    let desiredEnergy = 0;
                    for (let creep in _.filter(Game.creeps, c=>c.memory.role == 'hauler')) {

                    }
                }
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
