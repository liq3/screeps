// spawns, creeps, flags, rooms have .memory

const useProfiler = true

require('prototype_creep')
require('prototype_source')
require('prototype_room')
require('prototype_mineral')
require('prototype_controller')
require('RoomVisual')
require('Empire')
require('myUtils')
const spawnManager = require('spawnManager');
const roomManager = require('roomManager');

let creepRoles = ['builder','claimer','combat','hauler','decoy','geologist','harvester',
    'miner','praiser','scout','spawnHelper'];

global.creepFunctions = {};
for (let i of creepRoles) {
    creepFunctions[i] = require(i);
}

var debug = false;

let mainLoop = function() {
    Empire.deadCreeps = []
    for(let i in Memory.creeps) {
        if(!Game.creeps[i]) {
            let creep = Memory.creeps[i]
            if (creep.role === 'hauler' || creep.role === 'praiser') {
                Empire.deadCreeps.push(i)
            } else {
                delete Memory.creeps[i];
            }
        }
    }

    if (Memory.dangerRooms === undefined) {
        Memory.dangerRooms = []
    }

    if (Game.flags.baseTest) {
        myUtils.baseTest();
    } else if (Memory.flags && Memory.flags.baseTest){
        delete Memory.flags.baseTest
    }

    for (let i in Game.rooms) {
        try {
            roomManager.run(Game.rooms[i])
        } catch (err) {
            log(err.stack || err);
        }
    }

    let dangerFlags = _.filter(Game.flags, f => f.name.split(" ")[0] === 'danger');
    for (let i in dangerFlags) {
        let room = dangerFlags[i].pos.roomName;
        if (!Memory.dangerRooms.includes(room)) {
            Memory.dangerRooms.push(room);
        }
    }

	for (let name in Game.creeps) {
	    let creep = Game.creeps[name];

        try {
            if (Game.cpu.bucket > 5000) {
                if (creepFunctions[creep.memory.role] != undefined && !creep.spawning) {
                    creepFunctions[creep.memory.role].run(creep);
                } else if (creep.memory.role === 'recycle') {
                    creep.moveTo(creep.pos.findClosestByPath(FIND_MY_SPAWNS));
                } else if (!creep.spawning){
                    log("Undefined function for role: " + creep.memory.role);
                }
            }
        } catch (err) {
            log(`${name} ${creep.pos} \n ${err.stack || err}`);
        }
	}

    let towers = _.filter(Game.structures, s => s.structureType === STRUCTURE_TOWER);
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
        spawn.recycleCreep(spawn.pos.findClosestByRange( FIND_MY_CREEPS, {filter: c => c.memory.role === 'recycle'}));
        if (Memory.spawnTimes === undefined) {
            Memory.spawnTimes = {};
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

    if (Game.cpu.bucket > 8000) {
        if (false && Game.market.credits < 1000) {
            let orders = Game.market.getAllOrders(order => order.resourceType === RESOURCE_ENERGY && order.type === ORDER_BUY && order.price >= 0.018);
            if (orders.length > 0) {
                log(JSON.stringify(orders));
                orders.sort((a,b) => b.price - a.price);
                for (let order of orders) {
                    if (order.amount > 100) {
                        let sendAmount = order.amount;
                        if (Game.market.calcTransactionCost(order.amount, 'E61N94',order.roomName) + order.amount > Game.rooms['E61N94'].terminal.store[RESOURCE_ENERGY]) {
                            let sendCost = Game.market.calcTransactionCost(1000000,'E61N94',order.roomName) / 1000000;
                            sendAmount = order.amount * order.amount / (order.amount * (1+sendCost));
                        }
                        let err = Game.market.deal(order.id, sendAmount, 'E61N94');
                        log(`Deal: ${err}. ${sendAmount} for ${order.price} total ${order.amount*order.price}`);
                    }
                }
            }
        }
        let room = Game.rooms['W22N32']
        if (room && room.terminal && !room.terminal.cooldown && room.terminal.store[RESOURCE_HYDROGEN] > 1000) {
            let orders = Game.market.getAllOrders({type:ORDER_BUY, resourceType:RESOURCE_HYDROGEN, price:1})
            orders.sort(o => Game.market.calcTransactionCost(1000, room.name, o.roomName));
            let maxResources = room.terminal.store[RESOURCE_HYDROGEN]
            for (let order of orders) {
                let amount = _.min([maxResources, order.amount])
                let cost = Game.market.calcTransactionCost(amount, room.name, order.roomName)
                if (cost < room.terminal.store.energy && amount > 0) {
                    let err = Game.market.deal(order.id, amount, room.name)
                    log(`Deal: ${err}. ${amount} ${order.resourceType} for ${order.price} total ${order.amount*order.price}`);
                    maxResources -= amount
                }
            }
        }
    }

    if (Game.flags.intel) {
        let room = Game.flags.intel.room;
        let [left, top, width, height] = [10,10,11,11];
        for (let x = 0; x < width+1; x++) {

        }
        for (let x = 0; x < height+1; x++) {
            room.visual.line(left+x-0.5, top-0.5, left+x-0.5, top+height-0.5)
        }
        for (let y = 0; y < height+1; y++) {
            room.visual.line(left-0.5, top+y-0.5, left+width-0.5, top+y-0.5)
        }
        let [roomLeft, roomTop] = [30,40]
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                let name = `W${roomLeft-x}N${roomTop-y}`
                let color = 'white';
                if (Memory.rooms[name]) {
                    if (Memory.rooms[name].hostile) {
                        color = 'red';
                    } else if (Game.rooms[name] && Game.rooms[name].controller && Game.rooms[name].controller.my) {
                        color = 'green';
                    }
                    room.visual.circle(left+x, top+y, {fill:color});
                }
            }
        }
    }

    if (Memory.cpuTimes === undefined) {
        Memory.cpuTimes = [];
    }
    Memory.cpuTimes.push(Game.cpu.getUsed());
    if (Memory.cpuTimes.length > 1000) {
        Memory.cpuTimes.shift();
    }
}

module.exports.loop = mainLoop

if (useProfiler) {
    const profiler = require('screeps-profiler');
    profiler.enable();
    for (let i of creepRoles) {
        profiler.registerObject(creepFunctions[i], i);
    }
    profiler.registerObject(spawnManager, 'spawnManager')
    profiler.registerObject(Empire, 'Empire')
    //PathFinder.search = profiler.registerFN(PathFinder.search, 'PathFinder.search')
    module.exports.loop = () => profiler.wrap(mainLoop);
}
