/* global global */

global.myUtils = {};

global.myUtils.avgCpu = function() {
	log(_.sum(Memory.cpuTimes) / Memory.cpuTimes.length);
}

global.myUtils.deleteSpawnCensus = function() {
	for (let i of Memory.rooms[i]) {
		if (Memory.rooms[i].spawnCensus) {
			delete Memory.rooms[i].spawnCensus
		}
	}
}

global.myUtils.changeRole = function(role1, role2) {
	for (let c in Game.creeps) {
		if (Game.creeps[c].memory.role === role1) {
			Game.creeps[c].memory.role = role2
		}
	}
}

global.myUtils.getSpawnTimes = function() {
	for (let i in Game.spawns) {
		let spawn = Game.spawns[i];
		let totalTimeSpawning = 0;
		for (let {tick, time} of Memory.spawnTimes[spawn.id]) {
			totalTimeSpawning += time;
		}
		log(`Spawn: ${spawn.id} Time: ${totalTime} / ${Game.time - Memory.spawnTimes[spawn.id][0].time}`);
	}
}

global.myUtils.toggleJobDisplay = function() {
	if (Memory.visuals === undefined) {
		Memory.visuals = {};
	}
	if (Memory.visuals.displayJobs != undefined) {
		Memory.visuals.displayJobs = !Memory.visuals.displayJobs;
	} else {
		Memory.visuals.displayJobs = false;
	}
}

global.myUtils.getSourceInfo = function () {
	for (let r of Empire.getOwnedRooms()) {
		for (let source of r.find(FIND_SOURCES)) {
			let amount = source.container.store.energy;
			for (let res of source.pos.findInRange(FIND_DROPPED_RESOURCES, 1, {filter: {resourceType:RESOURCE_ENERGY}})) {
				amount += res.amount;
			}
			log(`${source.pos} ${amount}`)
		}
	}
}

global.myUtils.partInfo = function () {
	for (let mainRoom of _.filter(Game.rooms, r => r.controller && r.controller.my)) {
		let parts = 0;
		let desiredCapacity = 0;
		let spawn = mainRoom.find(FIND_MY_SPAWNS)[0];
		for (let rr of mainRoom.getRoomNames()) {
			if (Game.rooms[rr]) {
				for (let source of Game.rooms[rr].find(FIND_SOURCES)) {
					let path = PathFinder.search(spawn.pos, {pos:source.pos, range: 2}, {roomCallBack:Empire.costMatrixCallback, swamp:10, plains:2});
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
		log(`Room: ${r} Parts: ${parts}`);
	}
}

global.myUtils.energyPullInfo = function() {
	for (let id in Memory.energyPull) {
		let thing = Game.getObjectById(id);
		let mem = Memory.energyPull[id];
		log(thing +" "+ mem.desired + " " + mem.reserved)
	}
}

global.myUtils.createRoadBetweenFlags = function() {
	if (Game.flags.roadStart && Game.flags.roadEnd) {
		let start = Game.flags.roadStart.pos;
		let end = Game.flags.roadEnd.pos;
		let path = PathFinder.search(start, {pos:end, range:0}, {plainsCost: 1, swampCost:1});
		for (let pos of path.path) {
			Game.rooms[pos.roomName].createConstructionSite(pos.x,pos.y, STRUCTURE_ROAD);
		}
	} else {
		log('Flags not set properly! Need "roadStart" and "roadEnd"');
	}
}

global.myUtils.clearTransportMemory = function() {
	for (let i in Game.creeps) {
		let creep = Game.creeps[i];
		if (creep.memory.role === 'hauler') {
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
	log (ret + " parts.");
}

global.myUtils.dumpMarket = function() {
	let orders = {}
	for (let order of Game.market.getAllOrders()) {
		if (!orders[order.resourceType]) {
			orders[order.resourceType] = {}
			orders[order.resourceType][ORDER_BUY] = []
			orders[order.resourceType][ORDER_SELL] = []
		}
		//log(JSON.stringify(order, null, 4), JSON.stringify(orders))
		orders[order.resourceType][order.type].push({price:order.price, amount:order.amount})
	}
	for (let resourceType in orders) {
		let stats = {'buy':{min:Infinity, max:-Infinity, total:0, count:0},
					'sell':{min:Infinity, max:-Infinity, total:0, count:0}};
		for (let orderType in orders[resourceType]) {
			for (let order of orders[resourceType][orderType]) {
				stats[orderType].count += 1
				stats[orderType].total += order.price
				if (order.price < stats[orderType].min) {
					stats[orderType].min = order.price
				}
				if (order.price > stats[orderType].max) {
					stats[orderType].max = order.price
				}
			}
		}
		log(`${resourceType}: Sell Min:${stats[ORDER_SELL].min} Max:${stats[ORDER_SELL].max} Average:${stats[ORDER_SELL].total / stats[ORDER_SELL].count} Count:${stats[ORDER_SELL].count} Buy Min:${stats[ORDER_BUY].min} Max:${stats[ORDER_BUY].max} Average:${stats[ORDER_BUY].total / stats[ORDER_BUY].count} Count:${stats[ORDER_BUY].count}`)
	}
}

global.myUtils.resourceTradeCost = function(room, resource, type) {
	for (let order of Game.market.getAllOrders({type:type, resourceType:resource, price:1})) {
		log(`${order.roomName}: ${Game.market.calcTransactionCost(1000, room, order.roomName)}`)
	}
}

global.myUtils.help = function() {
	log(JSON.stringify(myUtils))
}

global.myUtils.calcRoomEnergyForSpawn = function(spawn) {
	for (let r in Memory.rooms) {
		let room = Memory.rooms[r]
		let energyRate = 0
		let upkeep = 0
		let completePath = true
		if (_.size(room.sources) === 0) {
			continue;
		}
		for (let si in room.sources) {
			let s = room.sources[si]
			energyRate += (s.capacity === 1500 ? 3000 : s.capacity) / 300
			let path = PathFinder.search(spawn.pos, {pos:s.pos, range:1}, {maxOps:10000})
			upkeep -= (path.cost * 2 * (s.capacity / 300) * 2/3 + 100) / 1500
			upkeep -= 800 / (1500 - path.cost)
		}
		if (room.controller) {
			let path = PathFinder.search(spawn.pos, {pos:room.controller.pos, range:1}, {maxOps:10000})
			upkeep -= 650 / (600 - path.cost)
		}
		log(`Room:${r} EnergyRate:${energyRate} Upkeep:${upkeep} Net:${energyRate+upkeep}`)
	}
}

global.myUtils.baseTest = function() {
	if (Game.cpu.bucket < 5000) {
		return;
	}
	function set(x,y,v) {
		Game.flags.baseTest.memory.buildings[y*50+x] = v
	}
	function get(x,y) {
		return Game.flags.baseTest.memory.buildings[y*50+x]
	}
	function key(x,y) {
		return y*50+x
	}
	function addPath(path) {
		for (let pos of path) {
			set(pos.x, pos.y, STRUCTURE_ROAD)
		}
	}
	let startTime = Game.cpu.getUsed()
	let flag = Game.flags.baseTest
	let storage = new RoomPosition(flag.pos.x+2, flag.pos.y, flag.pos.roomName)
	if (!flag.memory.done) {
		flag.memory.buildings = {}
		for (let source of flag.room.find(FIND_SOURCES)) {
			let path = PathFinder.search(flag.pos, {pos:source.pos, range:1}, {plains:1, swamp:1})
			addPath(path.path)
		}
		addPath(PathFinder.search(flag.pos, {pos:flag.room.controller.pos, range:1}, {plains:1, swamp:1}).path)

		set(flag.pos.x+2, flag.pos.y, STRUCTURE_STORAGE)
		let open = []
		open.push(key(storage.x, storage.y))
		let closed = {}
		let terrain = Game.map.getRoomTerrain(flag.pos.roomName)
		let totalExt = 0
		while(open.length) {
			let index = open.shift()
			closed[index] = true
			let _x = index % 50;
			let _y = Math.floor(index/50)
			let roads = 0
			let walls = 0
			if (terrain.get(_x,_y) !== TERRAIN_MASK_WALL) {
				if (flag.pos.inRangeTo(_x,_y, 1) || storage.inRangeTo(_x,_y,1)) {
					roads -= 50
				} else {
					for (let x = _x-2; x < _x+3; x++) {
						for (let y = _y-2; y < _y+3; y++) {
							if (get(x,y) === STRUCTURE_ROAD) {
								roads++;
							}
							if (Math.abs(_x-x) < 2 && Math.abs(_y-y) < 2) {
								if (terrain.get(x,y) === TERRAIN_MASK_WALL) {
									walls++;
								}
							}
						}
					}
				}
				if (roads < 5 && walls == 0 ) {
					if (!flag.pos.isEqualTo(_x,_y) && !storage.isEqualTo(_x,_y)) {
						if (get(_x,_y) === STRUCTURE_EXTENSION) {
							totalExt--;
						}
						set(_x,_y,STRUCTURE_ROAD)
					}
					for (let x = _x-1; x < _x+2; x++) {
						for (let y = _y-1; y < _y+2; y++) {
							if (open.indexOf(key(x,y)) < 0 && !(key(x,y) in closed) && x >= 6 && x < 44 && y >= 6 && y < 44) {
								if (get(x,y) === STRUCTURE_EXTENSION || get(x,y) === STRUCTURE_ROAD || get(x,y) === undefined) {
									open.push(key(x,y))
								}
								if ((get(x,y) === STRUCTURE_EXTENSION || get(x,y) === undefined)
									&& !flag.pos.inRangeTo(x,y,1) && !storage.inRangeTo(x,y,1)) {
									if (totalExt < 70) {
										set(x,y,STRUCTURE_EXTENSION);
									}
									totalExt++;
								}
							}
						}
					}
				}
			}
			if (totalExt >= 70) {
				break;
			}
		}
		function reverseKey(k) {
			return [k % 50, Math.floor(k/50)]
		}
		flag.room.memory.plannedBuildings = {}
		let mem = flag.room.memory.plannedBuildings
		mem.extensions = []
		mem.roads = []
		mem.storage = []
		for (let i in flag.memory.buildings) {
			let [x,y] = reverseKey(i)
			let type = get(x,y)
			if (type === STRUCTURE_ROAD) {
				mem.roads.push({x:x, y:y})
			} else if (type === STRUCTURE_EXTENSION) {
				mem.extensions.push({x:x, y:y})
			} else if (type === STRUCTURE_STORAGE) {
				mem.storage.push({x:x, y:y})
			}
		}
		_.forEach([mem.roads, mem.extensions], m => m.sort((a,b) => flag.pos.getRangeTo(a.x,a.b) - flag.pos.getRangeTo(b.x,b.y)))
		flag.memory.done = true;
	}
	let visual = new RoomVisual(flag.pos.roomName)
	for (let i in flag.memory.buildings) {
		let type = flag.memory.buildings[i]
		let x = i % 50
		let y = Math.floor(i/50)
		visual.structure(x,y,type);
	}
	visual.connectRoads()
	log(`baseTest() took ${Game.cpu.getUsed() - startTime}`)
}

global.myUtils.clearCache = function() {

}

global.myUtils.planRemoteMineRoads = function() {
	function addPath(path) {
		for (let pos of path) {
			if (!Memory.rooms[pos.roomName].plannedRoads) {
				Memory.rooms[pos.roomName].plannedRoads = []
			}
			Memory.rooms[pos.roomName].plannedRoads.push({x:pos.x, y:pos.y, type:STRUCTURE_ROAD})
		}
	}
	for (let room of Empire.getOwnedRooms()) {
		if (room.controller.my && Memory.rooms[room.name].remoteMining) {
			for (let remoteName of Memory.rooms[room.name].remoteMining) {
				if (Game.rooms[remoteName]) {
					for (let source of Game.rooms[remoteName].find(FIND_SOURCES)) {
						let path = PathFinder.search(room.find(FIND_MY_STRUCTURES, {filter: {structureType:STRUCTURE_SPAWN}})[0].pos,
							{pos:source.pos, range:2}, {roomCallback:Empire.costMatrixCallback, plainsCost:2, swampCost:2})
						addPath(path.path);
					}
				} else if (Memory.rooms[remoteName] && Memory.rooms[remoteName].sources) {
					for (let source of Memory.rooms[remoteName].sources) {
						let path = PathFinder.search(room.find(FIND_MY_STRUCTURES, {filter: {structureType:STRUCTURE_SPAWN}})[0].pos,
							{pos:new RoomPosition(...Object.values(source.pos)), range:2}, {roomCallback:Empire.costMatrixCallback, plainsCost:2, swampCost:2})
						addPath(path.path);
					}
				}
			}
		}
	}
}

global.myUtils.pathfind = function(start, goal, opts) {
	let allowedRooms = Game.map.findRoute(start.roomName, goal.pos.roomName).reduce((o, v) => {o[v.room] = v; return o})
	function callback(room) {
		if (allowedRooms[room]) {
			return PathFinder.CostMatrix()
		} else {
			return false
		}
	}
	opts['roomCallback'] = callback
	let {path, cost, ops, incomplete} = PathFinder.search(start, goal, opts);
	log(cost, ops, incomplete);
}
